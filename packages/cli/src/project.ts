import * as fs from "node:fs";
import * as path from "node:path";
import * as tstl from "typescript-to-lua";
import { CliError } from "./errors";

export interface Manifest {
    name: string;
    version: string;
    dependencies: unknown;
    requiredDependencies?: unknown;
    optionalDependencies?: unknown;
    requiredPermissions?: unknown;
    optionalPermissions?: unknown;
    urls?: unknown;
    resources?: unknown;
    autoEnable?: unknown;
    hasSettingsIcon?: unknown;
    hasRibbonIcon?: unknown;
    contactEmailAddress?: unknown;
}

export interface Project {
    cwd: string;
    tsconfigPath: string;
    manifestPath: string;
    /** Undefined when plugin.json is missing or unparseable; manifestError says which. */
    manifest: Manifest | undefined;
    manifestError: string | undefined;
    srcDir: string;
    outDir: string;
    entryFile: string;
    parsed: tstl.ParsedCommandLine;
    packageJson: PackageJson | undefined;
    syncVersion: boolean;
}

export interface PackageJson {
    name?: string;
    version?: string;
    rs3?: {
        syncVersion?: boolean;
    };
}

export function loadProject(cwd: string): Project {
    const tsconfigPath = path.join(cwd, "tsconfig.json");
    if (!fs.existsSync(tsconfigPath)) {
        throw new CliError("no tsconfig.json here, so there is no plugin to build", [
            `looked in ${cwd}`,
            "run this from the plugin folder, or scaffold one with: rs3-plugin init my-plugin",
        ]);
    }

    const parsed = tstl.parseConfigFileWithSystem(tsconfigPath);
    const srcDir = parsed.options.rootDir ?? path.join(cwd, "src");
    const outDir = parsed.options.outDir ?? path.join(cwd, "dist");

    const manifestPath = path.join(cwd, "plugin.json");
    let manifest: Manifest | undefined;
    let manifestError: string | undefined;
    if (!fs.existsSync(manifestPath)) {
        manifestError = "plugin.json is missing";
    } else {
        try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;
        } catch (error) {
            manifestError = `plugin.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    let packageJson: PackageJson | undefined;
    const packageJsonPath = path.join(cwd, "package.json");
    if (fs.existsSync(packageJsonPath)) {
        try {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageJson;
        } catch {
            packageJson = undefined;
        }
    }

    return {
        cwd,
        tsconfigPath,
        manifestPath,
        manifest,
        manifestError,
        srcDir,
        outDir,
        entryFile: path.join(srcDir, "main.ts"),
        parsed,
        packageJson,
        syncVersion: packageJson?.rs3?.syncVersion === true,
    };
}

export function sdkRoot(): string {
    return path.resolve(__dirname, "..");
}

export function sdkVersion(): string {
    const pkg = JSON.parse(fs.readFileSync(path.join(sdkRoot(), "package.json"), "utf8")) as { version: string };
    return pkg.version;
}
