#!/usr/bin/env node
import * as path from "node:path";
import { build } from "./build";
import { dev } from "./dev";
import { dependenciesFromFlag, init } from "./init";
import { printError, printProblems, printSummary } from "./report";
import { permissionNames } from "./permissions";
import { sdkVersion } from "./project";

const BOOLEAN_FLAGS = new Set([
    "dev", "help", "version", "quiet", "yes", "sync-version", "no-sync-version", "local", "registry",
    "settings-icon", "no-settings-icon", "ribbon-icon", "no-ribbon-icon",
]);

interface Args {
    flags: Record<string, string | boolean>;
    positional: string[];
}

function parseArgs(argv: string[]): Args {
    const flags: Record<string, string | boolean> = {};
    const positional: string[] = [];
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg.startsWith("--")) {
            positional.push(arg);
            continue;
        }
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (BOOLEAN_FLAGS.has(key) || next === undefined || next.startsWith("--")) {
            flags[key] = true;
        } else {
            flags[key] = next;
            i++;
        }
    }
    return { flags, positional };
}

function usage(): string {
    return [
        `rs3-plugin ${sdkVersion()}`,
        "",
        "Usage:",
        "  rs3-plugin init [name]            scaffold a new plugin in ./<name> (asks what it does not know)",
        "  rs3-plugin build [--out <dir>]    compile src/ to readable Lua in dist/ and run checks",
        "  rs3-plugin build --dev            single-file bundle with source-mapped tracebacks",
        "  rs3-plugin dev [--out <dir>]      rebuild on change (dev mode)",
        "",
        "Options:",
        "  --out <dir>    copy the built plugin into <dir>/<plugin name>/ (your client's plugin folder)",
        "  --cwd <dir>    run as if started from <dir>",
        "  --quiet        only print problems",
        "",
        "init answers (skip the prompts):",
        "  --yes                         accept defaults for anything not given",
        "  --permissions <a,b>           required permissions (default none)",
        "  --optional-permissions <a,b>  optional permissions (default none)",
        "  --urls <list>                 comma-separated, each `name=url` or a bare url (named api, api2, ...);",
        "                                asked for when a chosen permission needs urls",
        "  --deps <list>                 required library plugins from mod.io: `prettyui` (known name) or `name=<mod.io id>`",
        "  --optional-deps <list>        same, for optional dependencies",
        "  --settings-icon | --no-settings-icon",
        "  --ribbon-icon | --no-ribbon-icon",
        "                                plugin.json hasSettingsIcon / hasRibbonIcon (default no)",
        "  --contact-email <address>     plugin.json contactEmailAddress (default none)",
        "  --plugin-version <x.y.z>      initial version (default 0.1.0)",
        "  --sync-version | --no-sync-version",
        "                                keep plugin.json's version equal to package.json's (default yes)",
        "  --local | --registry          depend on this SDK checkout (file:...) or on the npm package (^version);",
        "                                default: local when run from a checkout, registry when installed",
        "",
        `known permissions: ${permissionNames().join(", ")}`,
    ].join("\n");
}

function stringFlag(flags: Args["flags"], name: string): string | undefined {
    const value = flags[name];
    return typeof value === "string" ? value : undefined;
}

/** `--name` -> true, `--no-name` -> false, neither -> undefined (ask or default). */
function tristate(flags: Args["flags"], name: string): boolean | undefined {
    if (flags[`no-${name}`] === true) {
        return false;
    }
    if (flags[name] === true) {
        return true;
    }
    return undefined;
}

/** `--flag a,b,c` -> ["a", "b", "c"]; a bare `--flag` means an empty list. */
function listFlag(flags: Args["flags"], name: string): string[] | undefined {
    const value = flags[name];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        return [];
    }
    return value
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s !== "");
}

async function main(): Promise<void> {
    const { flags, positional } = parseArgs(process.argv.slice(2));
    const command = positional[0];
    const cwd = path.resolve(stringFlag(flags, "cwd") ?? process.cwd());

    if (flags.version === true) {
        console.log(sdkVersion());
        return;
    }
    if (command === undefined || flags.help === true) {
        console.log(usage());
        process.exitCode = flags.help === true ? 0 : 1;
        return;
    }

    switch (command) {
        case "build": {
            const result = build({
                cwd,
                dev: flags.dev === true,
                deployTo: stringFlag(flags, "out"),
            });
            printProblems(result.problems);
            if (flags.quiet !== true) {
                printSummary(result);
            }
            process.exitCode = result.ok ? 0 : 1;
            return;
        }
        case "dev": {
            dev({ cwd, deployTo: stringFlag(flags, "out") });
            return;
        }
        case "init": {
            await init({
                cwd,
                interactive: flags.yes !== true && process.stdin.isTTY === true,
                answers: {
                    name: positional[1],
                    requiredPermissions: listFlag(flags, "permissions"),
                    optionalPermissions: listFlag(flags, "optional-permissions"),
                    urls: stringFlag(flags, "urls") ?? stringFlag(flags, "api-url"),
                    requiredDependencies: dependenciesFromFlag(stringFlag(flags, "deps"), "--deps"),
                    optionalDependencies: dependenciesFromFlag(stringFlag(flags, "optional-deps"), "--optional-deps"),
                    settingsIcon: tristate(flags, "settings-icon"),
                    ribbonIcon: tristate(flags, "ribbon-icon"),
                    contactEmail: stringFlag(flags, "contact-email"),
                    version: stringFlag(flags, "plugin-version"),
                    syncVersion: tristate(flags, "sync-version"),
                    sdkSource: flags.registry === true ? "registry" : flags.local === true ? "local" : undefined,
                },
            });
            return;
        }
        default:
            console.error(`error: unknown command "${command}"\n`);
            console.log(usage());
            process.exitCode = 1;
    }
}

main().catch((error: unknown) => {
    printError(error);
    process.exitCode = 1;
});
