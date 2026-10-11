import * as fs from "node:fs";
import * as path from "node:path";
import { findLibrary } from "./libraries";
import { findPermission, loadPermissions, permissionNames } from "./permissions";
import type { Manifest } from "./project";

export interface Problem {
    level: "error" | "warning";
    file?: string;
    line?: number;
    message: string;
    /** Printed indented under the message, for saying how to fix it. */
    hint?: string | string[];
}

export interface OutputFile {
    path: string;
    code: string;
}

export interface OutputContext {
    srcDir: string;
    outDir: string;
    dev: boolean;
}

const DEPENDENCY_SHAPE_HINT = (key: string) => [
    "name each dependency and give its mod.io id:",
    "",
    `    "${key}": { "prettyui": 6398181 }`,
    "",
    "the id is the number on the plugin's mod.io page",
];

/** Standard library pieces the sandbox removes or replaces. */
const FORBIDDEN_GLOBALS: Array<{ pattern: RegExp; what: string }> = [
    { pattern: /\bos\.\w+/, what: "the os library" },
    { pattern: /\bio\.\w+/, what: "the io library" },
    { pattern: /\bdebug\.\w+/, what: "the debug library" },
    { pattern: /\bloadstring\s*\(/, what: "loadstring" },
    { pattern: /\bloadfile\s*\(/, what: "loadfile" },
    { pattern: /\bdofile\s*\(/, what: "dofile" },
    { pattern: /(?<![\w.])load\s*\(/, what: "load" },
];

export function checkManifest(manifest: Manifest | undefined, manifestError: string | undefined, file: string): Problem[] {
    if (manifest === undefined) {
        // No file prefix: these messages already name plugin.json.
        return [
            {
                level: "error",
                message: manifestError ?? "plugin.json could not be read",
                hint: fs.existsSync(file)
                    ? ["the position above is where the parser gave up, usually a trailing comma or a missing quote"]
                    : ["every plugin needs a plugin.json beside its package.json", "rs3-plugin init writes one for you"],
            },
        ];
    }
    const problems: Problem[] = [];
    const error = (message: string) => problems.push({ level: "error", file, message });
    const warning = (message: string) => problems.push({ level: "warning", file, message });

    if (typeof manifest.name !== "string" || manifest.name.trim() === "") {
        error('"name" is required and must be a non-empty string');
    }
    if (typeof manifest.version !== "string" || manifest.version.trim() === "") {
        error('"version" is required and must be a string such as "1.0.0"');
    }
    if (manifest.dependencies === undefined) {
        problems.push({
            level: "error",
            file,
            message: '"dependencies" is required',
            hint: ['write {} when the plugin depends on nothing:', "", '    "dependencies": {}'],
        });
    } else if (!isPlainObject(manifest.dependencies) && !Array.isArray(manifest.dependencies)) {
        error('"dependencies" must be an object mapping identifiers to mod.io ids');
    }

    if (Array.isArray(manifest.dependencies) && manifest.dependencies.length === 0) {
        warning('"dependencies" is []; the client expects an object, so write {} instead');
    }

    for (const key of ["requiredDependencies", "optionalDependencies"] as const) {
        const value = manifest[key];
        if (value === undefined) {
            continue;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) {
                warning(`"${key}" is []; the client expects an object, so write {} instead`);
            } else {
                problems.push({
                    level: "error",
                    file,
                    message: `"${key}" is a list of names, which the client no longer accepts`,
                    hint: DEPENDENCY_SHAPE_HINT(key),
                });
            }
            continue;
        }
        if (!isPlainObject(value)) {
            problems.push({
                level: "error",
                file,
                message: `"${key}" must be an object mapping identifiers to mod.io ids`,
                hint: DEPENDENCY_SHAPE_HINT(key),
            });
            continue;
        }
        for (const [name, id] of Object.entries(value)) {
            if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
                error(`"${key}.${name}" must be a positive mod.io id`);
                continue;
            }
            const known = findLibrary(name);
            if (known === undefined) {
                problems.push({
                    level: "warning",
                    file,
                    message: `"${key}.${name}" is not in the known library list`,
                    hint: ["expected if the library is new or private", "otherwise refresh the list with: npm run deps:dump"],
                });
            } else if (known.id !== id) {
                problems.push({
                    level: "warning",
                    file,
                    message: `"${key}.${name}" has id ${id} but the known library list says ${known.id}`,
                    hint: ["check the id on the plugin's mod.io page; the client resolves dependencies by id, not by name"],
                });
            }
        }
    }

    for (const key of ["requiredPermissions", "optionalPermissions"] as const) {
        const value = manifest[key];
        if (value === undefined) {
            continue;
        }
        if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
            problems.push({
                level: "error",
                file,
                message: `"${key}" must be a list of permission names`,
                hint: ["", `    "${key}": [${permissionNames().map((p) => JSON.stringify(p)).join(", ")}]`, "", "use [] to ask for none"],
            });
            continue;
        }
        for (const permission of value as string[]) {
            if (findPermission(permission) === undefined) {
                problems.push({
                    level: "error",
                    file,
                    message: `"${key}" lists unknown permission "${permission}"`,
                    hint: [
                        "the client refuses to load a plugin that asks for a permission it does not know",
                        `valid permissions: ${permissionNames().join(", ")}`,
                    ].join("\n"),
                });
            }
        }
    }

    if (manifest.urls !== undefined) {
        if (!isPlainObject(manifest.urls)) {
            problems.push({
                level: "error",
                file,
                message: '"urls" must be an object mapping names to URLs',
                hint: ["", '    "urls": { "api": "https://example.com/" }'],
            });
        } else {
            for (const [name, url] of Object.entries(manifest.urls)) {
                if (typeof url !== "string" || !isHttpUrl(url)) {
                    problems.push({
                        level: "error",
                        file,
                        message: `"urls.${name}" is not an http or https URL`,
                        hint: ["the client only accepts absolute http(s) URLs, such as https://example.com/"],
                    });
                }
            }
        }
    }

    for (const key of ["autoEnable", "hasSettingsIcon", "hasRibbonIcon"] as const) {
        if (manifest[key] !== undefined && typeof manifest[key] !== "boolean") {
            error(`"${key}" must be true or false`);
        }
    }
    if (manifest.autoEnable !== undefined) {
        warning('"autoEnable" is no longer read by the client and can be deleted');
    }
    if (manifest.contactEmailAddress !== undefined && typeof manifest.contactEmailAddress !== "string") {
        error('"contactEmailAddress" must be a string');
    }

    return problems;
}

export function checkOutput(files: OutputFile[], manifest: Manifest | undefined, context: OutputContext): Problem[] {
    const problems: Problem[] = [];
    const dev = context.dev;
    const pluginFiles = files.filter((f) => !/lualib_bundle\.lua$/.test(f.path));

    // Only the plugin's own files count. The bundled runtime always contains the assignment,
    // inside definePlugin, so including it here would make this check pass for every plugin.
    const ownFiles = pluginFiles.filter((f) => !f.path.split(path.sep).includes("lua_modules"));
    const hasEntry = ownFiles.some((f) => /\bPluginLogic\s*=|\bfunction\s+PluginLogic\b|\bdefinePlugin\s*\(/.test(f.code));
    if (!hasEntry) {
        problems.push({
            level: "error",
            message: "nothing in this plugin sets up a tick handler, so the client would load it and never run it",
            hint: [
                "call definePlugin from src/main.ts:",
                "",
                '    import { definePlugin } from "rs3-api-extended";',
                "",
                "    definePlugin({ modules: [] });",
                "",
                "or assign the PluginLogic global yourself",
            ],
        });
    }

    if (!dev) {
        for (const file of pluginFiles) {
            const helpers = new Set<string>();
            for (const match of file.code.matchAll(/__TS__(\w+)/g)) {
                helpers.add(match[1]);
            }
            if (helpers.size > 0) {
                problems.push({
                    level: "error",
                    file: sourceOf(file.path, context),
                    message: `needs the TypeScriptToLua helper library for ${[...helpers].join(", ")}, which a release build does not ship`,
                    hint: [
                        "something here has no direct Lua equivalent, usually an array, string or object",
                        "method, a class, spread, Map or Set",
                        "use plain loops, tables and functions instead",
                    ],
                });
            }
        }
    }

    const required = stringArray(manifest?.requiredPermissions);
    const optional = stringArray(manifest?.optionalPermissions);
    for (const permission of loadPermissions()) {
        const users = pluginFiles.filter((f) => permission.gates.some((gate) => gate.test(f.code)));
        if (users.length === 0) {
            continue;
        }
        if (!required.includes(permission.name) && !optional.includes(permission.name)) {
            const hint: string[] = [];
            if (!dev) {
                hint.push(`called from ${describeCallers(users, context)}`);
            }
            const merged = [...required.filter((p) => findPermission(p) !== undefined), permission.name];
            hint.push(`add it to requiredPermissions in plugin.json:`, "", `    "requiredPermissions": [${merged.map((p) => JSON.stringify(p)).join(", ")}]`);
            problems.push({
                level: "error",
                message: `${permission.gateLabel} needs the "${permission.name}" permission, which plugin.json does not ask for`,
                hint: hint.join("\n"),
            });
        }
        if (permission.needsUrls && manifest !== undefined) {
            const urls = isPlainObject(manifest.urls) ? Object.keys(manifest.urls) : [];
            if (urls.length === 0) {
                problems.push({
                    level: "warning",
                    message: `${permission.gateLabel} can only reach hosts that plugin.json lists under "urls", and it lists none`,
                    hint: ['name the hosts you call in plugin.json:', "", '    "urls": { "api": "https://example.com/" }'].join("\n"),
                });
            }
        }
    }

    for (const file of ownFiles) {
        for (const forbidden of FORBIDDEN_GLOBALS) {
            if (forbidden.pattern.test(file.code)) {
                problems.push({
                    level: "warning",
                    file: sourceOf(file.path, context),
                    message: `uses ${forbidden.what}, which the plugin sandbox does not provide`,
                    hint: ["the call will fail at runtime; there is no replacement inside the sandbox"],
                });
            }
        }
    }

    return problems;
}

function describeCallers(users: OutputFile[], context: OutputContext): string {
    const named = users.map((file) => path.relative(process.cwd(), sourceOf(file.path, context)));
    const shown = named.slice(0, 3).join(", ");
    return named.length > 3 ? `${shown} and ${named.length - 3} more` : shown;
}

// A release build writes one Lua file per source file, so dist/modules/login.lua came from
// src/modules/login.ts. Naming the Lua would send the reader into generated code.
function sourceOf(file: string, context: OutputContext): string {
    const relative = path.relative(context.outDir, file);
    if (relative.startsWith("..") || relative.split(path.sep).includes("lua_modules")) {
        return file;
    }
    return path.join(context.srcDir, relative.replace(/\.lua$/, ".ts"));
}

function firstLine(code: string, pattern: RegExp): number | undefined {
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
            return i + 1;
        }
    }
    return undefined;
}

function stringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
