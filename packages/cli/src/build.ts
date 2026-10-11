import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";
import * as tstl from "typescript-to-lua";
import { checkManifest, checkOutput, type OutputFile, type Problem } from "./checks";
import { makeReadable } from "./postprocess";
import { loadProject, type Project } from "./project";

export interface BuildOptions {
    cwd: string;
    /** Single bundle with source maps, instead of one readable file per source file. */
    dev?: boolean;
    deployTo?: string;
}

export interface BuildResult {
    ok: boolean;
    dev: boolean;
    problems: Problem[];
    notes: string[];
    files: string[];
    outDir: string;
    deployedTo?: string;
    project: Project;
}

export function build(options: BuildOptions): BuildResult {
    const dev = options.dev === true;
    const project = loadProject(options.cwd);
    const problems: Problem[] = [];
    const notes: string[] = [];

    syncManifestVersion(project, notes);
    problems.push(...checkManifest(project.manifest, project.manifestError, project.manifestPath));

    const extend: tstl.CompilerOptions = dev
        ? {
              luaBundle: "main.lua",
              luaBundleEntry: project.entryFile,
              luaLibImport: tstl.LuaLibImportKind.Require,
              sourceMapTraceback: true,
          }
        : {};

    fs.rmSync(project.outDir, { recursive: true, force: true });

    const written: OutputFile[] = [];
    const emit = tstl.transpileProject(project.tsconfigPath, extend, (fileName, text) => {
        const isLua = fileName.endsWith(".lua");
        const code = isLua && !dev ? makeReadable(text) : text;
        fs.mkdirSync(path.dirname(fileName), { recursive: true });
        fs.writeFileSync(fileName, code);
        if (isLua) {
            written.push({ path: fileName, code });
        }
    });

    for (const diagnostic of emit.diagnostics) {
        problems.push(toProblem(diagnostic));
    }

    const compiled = !problems.some((p) => p.level === "error");
    if (compiled) {
        copyStaticFiles(project);
        problems.push(...checkOutput(written, project.manifest, { srcDir: project.srcDir, outDir: project.outDir, dev }));
    }

    const ok = !problems.some((p) => p.level === "error");
    let deployedTo: string | undefined;
    if (ok && options.deployTo !== undefined && project.manifest !== undefined) {
        deployedTo = path.resolve(options.cwd, options.deployTo, project.manifest.name);
        fs.rmSync(deployedTo, { recursive: true, force: true });
        fs.cpSync(project.outDir, deployedTo, { recursive: true });
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
