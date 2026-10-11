#!/usr/bin/env node
// node scripts/dump-modio-libraries.js [--out <file>]
//
// Rewrites the library list the init command offers. Uses the same
// endpoint mod.io's own site calls to browse a game's mods
// (GET /games/@<name_id>/mods with an `x-modio-origin: web` header instead
// of an api_key); the key-based API only lets a key read the one game it
// was issued for, which isn't an option here.
// MODIO_GAME_ID, MODIO_GAME_NAME_ID, MODIO_TAG and MODIO_API_BASE override
// the defaults below; the tests point MODIO_API_BASE at a fixture server.
// Output is sorted so weekly diffs stay small.
const fs = require("node:fs");
const path = require("node:path");

const GAME_ID = Number(process.env.MODIO_GAME_ID ?? "13295");
const GAME_NAME_ID = process.env.MODIO_GAME_NAME_ID ?? "runescape";
const TAG = process.env.MODIO_TAG ?? "Library for other Plugins";
const API_BASE = (process.env.MODIO_API_BASE ?? "https://mod.io/v1").replace(/\/$/, "");
const PAGE = 100;

const outIndex = process.argv.indexOf("--out");
const OUT = outIndex >= 0 && process.argv[outIndex + 1] ? path.resolve(process.argv[outIndex + 1]) : path.resolve(__dirname, "..", "packages", "cli", "data", "modio-libraries.json");

async function main() {
    const mods = [];
    for (let offset = 0; ; offset += PAGE) {
        const page = await get(`/games/@${GAME_NAME_ID}/mods`, { tags: TAG, _limit: String(PAGE), _offset: String(offset), _sort: "name_id" });
        mods.push(...page.data);
        console.log(`  fetched ${mods.length}/${page.result_total}`);
        if (mods.length >= page.result_total || page.result_count === 0) {
            break;
        }
    }

    const libraries = mods
        .filter((m) => m.visible !== 0 && m.status === 1)
        .map((m) => ({
            id: m.id,
            name_id: m.name_id,
            name: m.name,
            summary: m.summary ?? "",
            profile_url: m.profile_url ?? `https://mod.io/g/${GAME_NAME_ID}/m/${m.name_id}`,
            author: m.submitted_by?.username ?? null,
            date_updated: typeof m.date_updated === "number" ? new Date(m.date_updated * 1000).toISOString() : null,
        }))
        .sort((a, b) => a.name_id.localeCompare(b.name_id));

    const output = {
        $comment: "Written by npm run deps:dump. The library plugins that rs3-plugin init offers.",
        generatedAt: new Date().toISOString(),
        source: `https://mod.io/g/${GAME_NAME_ID}/m?tags=${encodeURIComponent(TAG).replace(/%20/g, "+")}`,
        game: { id: GAME_ID, name_id: GAME_NAME_ID },
        tag: TAG,
        libraries,
    };

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);
    console.log(`wrote ${libraries.length} libraries to ${path.relative(process.cwd(), OUT)}`);
}

async function get(endpoint, query = {}) {
    const url = new URL(`${API_BASE}${endpoint}`);
    for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
    }
    const response = await fetch(url, { headers: { Accept: "application/json", "x-modio-origin": "web" } });
    if (!response.ok) {
        let detail = "";
        try {
            const body = await response.json();
            detail = body?.error?.message ? `: ${body.error.message}` : "";
        } catch {
            // no JSON body
        }
        throw new Error(`GET ${endpoint} -> HTTP ${response.status}${detail}`);
    }
    return response.json();
}

main().catch((error) => {
    const cause = error instanceof Error && error.cause instanceof Error ? ` (${error.cause.message})` : "";
    console.error(`error: ${error instanceof Error ? error.message : String(error)}${cause}`);
    process.exit(1);
});
