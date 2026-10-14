import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";
import * as tstl from "typescript-to-lua";
import { checkManifest, checkOutput, type OutputFile, type Problem } from "./checks";
import { makeReadable } from "./postprocess";
import { loadProject, type Project } from "./project";

export interface BuildOptions {
    cwd: string;
    /** Install into every client's dev_plugins folder as well as dist. */
    dev?: boolean;
    /** Folders to copy the finished plugin into, each under its own `<dir>/<plugin name>/`. */
    deployTo?: string[];
}

export interface BuildResult {
    ok: boolean;
    dev: boolean;
    problems: Problem[];
    notes: string[];
    files: string[];
    outDir: string;
    deployedTo: string[];
    project: Project;
}

export function build(options: BuildOptions): BuildResult {
    const dev = options.dev === true;
    const project = loadProject(options.cwd);
    const problems: Problem[] = [];
    const notes: string[] = [];

    syncManifestVersion(project, notes);
    problems.push(...checkManifest(project.manifest, project.manifestError, project.manifestPath));

    fs.rmSync(project.outDir, { recursive: true, force: true });

    const emitted: Array<{ file: string; text: string }> = [];
    const emit = tstl.transpileProject(project.tsconfigPath, {}, (fileName, text) => {
        emitted.push({ file: fileName, text });
    });

    const renames = flatNames(emitted, project.outDir);
    const written: OutputFile[] = [];
    for (const { file, text } of emitted) {
        const isLua = file.endsWith(".lua");
        const id = moduleID(file, project.outDir);
        let code = text;
        let target = file;
        if (isLua) {
            for (const [from, to] of renames) {
                code = code.split(`"${from}"`).join(`"${to}"`);
            }
            code = makeReadable(code);
            const renamed = renames.get(id);
            if (renamed !== undefined) {
                target = path.join(project.outDir, `${renamed}.lua`);
            }
        }
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, code);
        if (isLua) {
            written.push({ path: target, code, dependency: packageOf(id) !== undefined });
        }
    }

    for (const diagnostic of emit.diagnostics) {
        problems.push(toProblem(diagnostic));
    }

    const compiled = !problems.some((p) => p.level === "error");
    if (compiled) {
        noteHelpers(written, notes);
        copyStaticFiles(project);
        problems.push(...checkOutput(written, project.manifest, { srcDir: project.srcDir, outDir: project.outDir }));
    }

    const ok = !problems.some((p) => p.level === "error");
    const deployedTo: string[] = [];
    if (ok && project.manifest !== undefined) {
        for (const dir of options.deployTo ?? []) {
            const target = path.resolve(options.cwd, dir, project.manifest.name);
            fs.rmSync(target, { recursive: true, force: true });
            fs.cpSync(project.outDir, target, { recursive: true });
            deployedTo.push(target);
        }
    }

    return {
        ok,
        dev,
        problems,
        notes,
        files: written.map((f) => f.path),
        outDir: project.outDir,
        deployedTo,
        project,
    };
}

/** Rewrites the source plugin.json too, so `npm version patch` is the only bump needed. */
function syncManifestVersion(project: Project, notes: string[]): void {
    const target = project.packageJson?.version;
    if (!project.syncVersion || project.manifest === undefined || typeof target !== "string") {
        return;
    }
    if (project.manifest.version === target) {
        return;
    }
    const previous = project.manifest.version;
    project.manifest.version = target;
    const raw = JSON.parse(fs.readFileSync(project.manifestPath, "utf8")) as Record<string, unknown>;
    raw.version = target;
    fs.writeFileSync(project.manifestPath, `${JSON.stringify(raw, null, 2)}\n`);
    notes.push(`plugin.json version ${String(previous)} -> ${target} (follows package.json)`);
}

function moduleID(file: string, outDir: string): string {
    return path.relative(outDir, file).replace(/\.lua$/, "").split(path.sep).join(".");
}

function packageOf(id: string): string | undefined {
    const parts = id.split(".");
    if (parts[0] !== "lua_modules" || parts.length < 3) {
        return undefined;
    }
    return parts[1].startsWith("@") ? `${parts[1].slice(1)}-${parts[2]}` : parts[1];
}

function flatNames(emitted: Array<{ file: string }>, outDir: string): Map<string, string> {
    const ids = new Set<string>();
    for (const { file } of emitted) {
        if (!file.endsWith(".lua")) {
            continue;
        }
        ids.add(moduleID(file, outDir));
    }
    const byPackage = new Map<string, string[]>();
    for (const id of ids) {
        const owner = packageOf(id);
        if (owner === undefined) {
            continue;
        }
        byPackage.set(owner, [...(byPackage.get(owner) ?? []), id]);
    }
    const renames = new Map<string, string>();
    for (const [owner, members] of byPackage) {
        if (members.length === 1 && !ids.has(owner)) {
            renames.set(members[0], owner);
        }
    }
    return renames;
}

function noteHelpers(written: OutputFile[], notes: string[]): void {
    const helpers = new Set<string>();
    for (const file of written) {
        for (const match of file.code.matchAll(/^(?:local )?(?:function |local )?(__TS__\w+)\s*(?:=|\()/gm)) {
            helpers.add(match[1]);
        }
    }
    if (helpers.size === 0) {
        return;
    }
    const named = [...helpers].sort();
    const shown = named.slice(0, 6).join(", ");
    notes.push(`${named.length} compiler helper${named.length === 1 ? "" : "s"} in the output: ${shown}${named.length > 6 ? ", ..." : ""}`);
}

function copyStaticFiles(project: Project): void {
    fs.mkdirSync(project.outDir, { recursive: true });
    if (fs.existsSync(project.manifestPath)) {
        fs.copyFileSync(project.manifestPath, path.join(project.outDir, "plugin.json"));
    }
    const resources = path.join(project.cwd, "resources");
    if (fs.existsSync(resources) && fs.statSync(resources).isDirectory()) {
        fs.cpSync(resources, path.join(project.outDir, "resources"), { recursive: true });
    }
}

function toProblem(diagnostic: ts.Diagnostic): Problem {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    const level = diagnostic.category === ts.DiagnosticCategory.Error ? "error" : "warning";
    if (diagnostic.file !== undefined && diagnostic.start !== undefined) {
        const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        return { level, file: diagnostic.file.fileName, line: line + 1, message: `TS${diagnostic.code}: ${message}` };
    }
    return { level, message: `TS${diagnostic.code}: ${message}` };
}
