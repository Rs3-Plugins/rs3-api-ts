import * as fs from "node:fs";
import * as path from "node:path";

// The data lives in rs3-api-core because it describes the client, not this tool.
export interface PermissionInfo {
    name: string;
    description: string;
    /** Matched against the emitted Lua to spot calls that need this permission. */
    gates: RegExp[];
    gateLabel: string;
    needsUrls: boolean;
}

interface PermissionsFile {
    clientBuild: string;
    permissions: Array<Omit<PermissionInfo, "gates"> & { gates: string[] }>;
}

let cached: PermissionInfo[] | undefined;

export function permissionsPath(): string {
    const corePackage = require.resolve("rs3-api-core/package.json");
    return path.join(path.dirname(corePackage), "data", "permissions.json");
}

export function loadPermissions(): PermissionInfo[] {
    if (cached === undefined) {
        const file = JSON.parse(fs.readFileSync(permissionsPath(), "utf8")) as PermissionsFile;
        cached = file.permissions.map((p) => ({ ...p, gates: p.gates.map((g) => new RegExp(g)) }));
    }
    return cached;
}

export function findPermission(name: string): PermissionInfo | undefined {
    return loadPermissions().find((p) => p.name === name);
}

export function permissionNames(): string[] {
    return loadPermissions().map((p) => p.name);
}
