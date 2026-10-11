import * as fs from "node:fs";
import * as path from "node:path";
import { CliError } from "./errors";
import { sdkRoot } from "./project";

export interface LibraryInfo {
    id: number;
    name_id: string;
    name: string;
    summary: string;
    profile_url: string;
    author: string | null;
    date_updated: string | null;
}

export interface LibraryCatalog {
    generatedAt: string | null;
    source: string;
    game: { id: number; name_id: string };
    tag: string;
    libraries: LibraryInfo[];
}

export interface DependencyEntry {
    name: string;
    id: number;
}

let cached: LibraryCatalog | undefined;

export function catalogPath(): string {
    return path.join(sdkRoot(), "data", "modio-libraries.json");
}

export function loadCatalog(): LibraryCatalog {
    if (cached === undefined) {
        cached = JSON.parse(fs.readFileSync(catalogPath(), "utf8")) as LibraryCatalog;
    }
    return cached;
}

export function findLibrary(nameId: string): LibraryInfo | undefined {
    return loadCatalog().libraries.find((lib) => lib.name_id === nameId);
}

/** A bare name has to be in the catalog; `name=id` takes any mod.io id. */
export function parseDependencies(input: string): DependencyEntry[] {
    const out: DependencyEntry[] = [];
    for (const raw of input.split(",")) {
        const entry = raw.trim();
        if (entry === "") {
            continue;
        }
        const eq = entry.indexOf("=");
        if (eq > 0) {
            const name = entry.slice(0, eq).trim();
            const id = Number(entry.slice(eq + 1).trim());
            if (!Number.isInteger(id) || id <= 0) {
                throw new CliError(`"${entry}" does not end in a mod.io id`, [
                    "the part after = is the numeric id from the plugin's mod.io page",
                    `for example: ${name}=6398181`,
                ]);
            }
            out.push({ name, id });
            continue;
        }
        const known = findLibrary(entry);
        if (known === undefined) {
            const names = loadCatalog().libraries.map((l) => l.name_id);
            throw new CliError(`"${entry}" is not in the known library list`, [
                names.length > 0 ? `known libraries: ${names.join(", ")}` : "the known library list is empty",
                `if it is not listed, give its mod.io id: ${entry}=123456`,
                "or refresh the list with: npm run deps:dump",
            ]);
        }
        out.push({ name: known.name_id, id: known.id });
    }
    return out;
}

/** The client wants identifier -> mod.io id, and `{}` for none. */
export function toManifestDependencies(entries: DependencyEntry[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const entry of entries) {
        out[entry.name] = entry.id;
    }
    return out;
}
