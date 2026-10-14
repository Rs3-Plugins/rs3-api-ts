#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const { ASSET_GROUPS, collectNames, readTables, resolveCache } = require("./lib/gameval-source");

const root = path.resolve(__dirname, "..");

function flag(name) {
    return process.argv.includes(`--${name}`);
}

function option(name, fallback) {
    const at = process.argv.indexOf(`--${name}`);
    return at >= 0 && process.argv[at + 1] !== undefined ? process.argv[at + 1] : fallback;
}

const PACKAGE_DIR = path.resolve(option("package", path.join(root, "packages", "core")));
const TYPES_DIR = path.join(PACKAGE_DIR, "types", "ids");
const DATA_FILE = path.join(PACKAGE_DIR, "data", "gamevals.json");
const REPORT = option("report", undefined);
const CACHE_ID = option("cache-id", undefined);
const FORCE = flag("force");
const PROBE = flag("probe");
const WEEKLY = flag("weekly");

function isoWeek(date) {
    const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
    const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
    const week = Math.ceil(((day.getTime() - yearStart) / 86400000 + 1) / 7);
    return `${day.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function readRecorded() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
        return undefined;
    }
}

function declarationFor(member, names) {
    const union = names.map((name) => `        | ${JSON.stringify(name)}`).join("\n");
    return `/// <reference path="../config/AssetID.d.ts" />

declare namespace id {
    type ${member}Name =
${union};

    type ${member}Ids = { readonly [N in ${member}Name]: AssetID<${JSON.stringify(member)}> };

    interface ${member} extends ${member}Ids {}
}
`;
}

function fileNameFor(member) {
    return member
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase();
}

function indexFor(files) {
    return `${files.map((file) => `/// <reference path="./${file}.d.ts" />`).join("\n")}\n`;
}

function writeIfChanged(file, contents) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let current;
    try {
        current = fs.readFileSync(file, "utf8");
    } catch {
        current = undefined;
    }
    if (current === contents) {
        return false;
    }
    fs.writeFileSync(file, contents);
    return true;
}

function setOutput(name, value) {
    if (process.env.GITHUB_OUTPUT !== undefined) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
    }
}

async function main() {
    const recorded = readRecorded();

    if (WEEKLY && !FORCE && CACHE_ID === undefined && recorded !== undefined) {
        const week = isoWeek(new Date());
        if (isoWeek(new Date(recorded.timestamp)) === week) {
            console.log(`cache ${recorded.cacheId} is already this week's (${week}), nothing to look for until next week`);
            setOutput("updated", "false");
            setOutput("cache-id", String(recorded.cacheId));
            setOutput("revision", String(recorded.revision));
            return;
        }
    }

    const { cache, newest, withoutNames } = await resolveCache(CACHE_ID);

    console.log(`openrs2 beta: cache ${cache.cacheId}, build ${cache.revision}.${cache.minor}, ${cache.timestamp}`);
    if (recorded !== undefined) {
        console.log(`recorded:     cache ${recorded.cacheId}, revision ${recorded.revision}`);
    }
    for (const id of withoutNames) {
        console.log(`cache ${id} is newer but carries no archive 67, skipping it`);
    }

    setOutput("cache-id", String(cache.cacheId));
    setOutput("revision", String(cache.revision));

    if (!FORCE && recorded !== undefined && recorded.cacheId === cache.cacheId) {
        console.log("already generated from this cache");
        setOutput("updated", "false");
        return;
    }

    setOutput("updated", "true");
    setOutput("previous-revision", recorded === undefined ? "none" : String(recorded.revision));

    if (PROBE) {
        console.log(`cache ${cache.cacheId} has not been generated from yet`);
        return;
    }

    const tables = readTablesInto(await readTables(cache.cacheId));
    console.log(`read ${tables.size} asset name tables from archive 67 of cache ${cache.cacheId}`);

    const generated = [];
    const missing = [];
    const written = new Set();

    for (const entry of ASSET_GROUPS) {
        const table = tables.get(entry.table);
        if (table === undefined) {
            missing.push(entry.table);
            continue;
        }
        const { names, collisions, skipped } = collectNames(table);
        if (names.length === 0) {
            missing.push(entry.table);
            continue;
        }
        const file = fileNameFor(entry.member);
        writeIfChanged(path.join(TYPES_DIR, `${file}.d.ts`), declarationFor(entry.member, names));
        written.add(`${file}.d.ts`);
        generated.push({ ...entry, file, names: names.length, skipped, collisions });
        if (collisions.length > 0) {
            console.log(`  ${entry.table}: ${names.length} names, ${collisions.length} dropped to collisions`);
        }
    }

    for (const stale of fs.existsSync(TYPES_DIR) ? fs.readdirSync(TYPES_DIR) : []) {
        if (stale !== "index.d.ts" && !written.has(stale)) {
            fs.rmSync(path.join(TYPES_DIR, stale));
            console.log(`  removed stale ${stale}`);
        }
    }

    writeIfChanged(path.join(TYPES_DIR, "index.d.ts"), indexFor(generated.map((entry) => entry.file).sort()));

    const data = {
        generatedAt: new Date().toISOString(),
        cacheId: cache.cacheId,
        revision: cache.revision,
        minor: cache.minor,
        environment: cache.environment,
        timestamp: cache.timestamp,
        cacheUrl: cache.url,
        newestCacheId: newest.cacheId,
        totalNames: generated.reduce((sum, entry) => sum + entry.names, 0),
        missing: missing.sort(),
        types: generated.map((entry) => ({ member: entry.member, table: entry.table, group: entry.group, file: `types/ids/${entry.file}.d.ts`, names: entry.names, skipped: entry.skipped, collisions: entry.collisions.length })),
    };
    writeIfChanged(DATA_FILE, `${JSON.stringify(data, null, 4)}\n`);

    console.log(`wrote ${generated.length} declaration files, ${data.totalNames} names`);
    if (missing.length > 0) {
        console.log(`not in this cache: ${missing.join(", ")}`);
    }

    if (REPORT !== undefined) {
        fs.writeFileSync(path.resolve(REPORT), report(data, recorded));
    }
}

function readTablesInto(tables) {
    const out = new Map();
    for (const [table, names] of tables) {
        out.set(table, [...names]);
    }
    return out;
}

function report(data, recorded) {
    const was = recorded === undefined ? null : recorded;
    const lines = [
        `Regenerated the \`id\` names in \`rs3-api-core\` from archive 67 of cache [${data.cacheId}](${data.cacheUrl}) (build ${data.revision}.${data.minor}, ${data.environment}, ${data.timestamp.slice(0, 10)}).`,
        "",
        "| | previous | now |",
        "| --- | --- | --- |",
        `| cache | ${was === null ? "none" : was.cacheId} | ${data.cacheId} |`,
        `| revision | ${was === null ? "none" : was.revision} | ${data.revision} |`,
        `| names | ${was === null ? "none" : was.totalNames} | ${data.totalNames} |`,
        "",
    ];

    if (was !== null) {
        const before = new Map(was.types.map((entry) => [entry.member, entry.names]));
        const moved = data.types.filter((entry) => before.get(entry.member) !== entry.names);
        if (moved.length > 0) {
            lines.push("### Lookups that changed size", "", "| lookup | previous | now | delta |", "| --- | --- | --- | --- |");
            for (const entry of moved) {
                const previous = before.get(entry.member);
                const delta = previous === undefined ? entry.names : entry.names - previous;
                lines.push(`| \`id.${entry.member}\` | ${previous ?? "none"} | ${entry.names} | ${delta >= 0 ? "+" : ""}${delta} |`);
            }
            lines.push("");
        }
    }

    lines.push("Opened by the Sync gamevals workflow.");
    return `${lines.join("\n")}\n`;
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
