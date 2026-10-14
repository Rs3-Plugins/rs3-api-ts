const { OPENRS2_BASE, SCOPE, hasAssetNames, readAssetNames } = require("./js5");

const GAME = "runescape";
const ENVIRONMENT = "beta";
const CANDIDATES = 8;

const ASSET_GROUPS = [
    { group: 0, table: "component", member: "Component" },
    { group: 5, table: "bas", member: "BaseAnimSet" },
    { group: 9, table: "category", member: "Category" },
    { group: 12, table: "cursor", member: "Cursor" },
    { group: 14, table: "dbrow", member: "DBRow" },
    { group: 15, table: "dbtable", member: "DBTable" },
    { group: 16, table: "enum", member: "Enum" },
    { group: 20, table: "headbar", member: "Headbar" },
    { group: 21, table: "hitmark", member: "Hitmark" },
    { group: 24, table: "interface", member: "Interface" },
    { group: 25, table: "inv", member: "Inv" },
    { group: 28, table: "loc", member: "Loc" },
    { group: 29, table: "map_element", member: "MapElement" },
    { group: 32, table: "material", member: "Material" },
    { group: 34, table: "model", member: "Model" },
    { group: 35, table: "npc", member: "NPC" },
    { group: 36, table: "obj", member: "Obj" },
    { group: 37, table: "param", member: "Param" },
    { group: 41, table: "quest", member: "Quest" },
    { group: 44, table: "seq", member: "Seq" },
    { group: 49, table: "graphic", member: "Sprite" },
    { group: 50, table: "struct", member: "Struct" },
    { group: 55, table: "var_clan", member: "VarClan" },
    { group: 56, table: "var_clan_setting", member: "VarClanSetting" },
    { group: 57, table: "var_client", member: "VarClient" },
    { group: 61, table: "var_player", member: "VarPlayer" },
    { group: 64, table: "sound", member: "Sound" },
    { group: 69, table: "midi", member: "Music" },
    { group: 80, table: "var_player_group", member: "VarPlayerGroup" },
    { group: 89, table: "achievement", member: "Achievement" },
    { group: 90, table: "fontmetrics", member: "Font" },
    { group: 92, table: "stylesheet", member: "StyleSheet" },
    { group: 96, table: "ui_anim_curve", member: "UIAnimCurve" },
    { group: 97, table: "ui_anim", member: "UIAnim" },
];

async function getJson(url) {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) {
        throw new Error(`GET ${url} -> ${response.status} ${response.statusText}`);
    }
    return response.json();
}

function describe(cache) {
    const build = cache.builds?.[0];
    return {
        cacheId: cache.id,
        revision: build?.major ?? null,
        minor: build?.minor ?? null,
        environment: cache.environment,
        timestamp: cache.timestamp,
        url: `${OPENRS2_BASE}/caches/${SCOPE}/${cache.id}`,
    };
}

async function listCaches() {
    const caches = await getJson(`${OPENRS2_BASE}/caches.json`);
    const seen = new Set();
    return caches
        .filter((cache) => cache.game === GAME && cache.environment === ENVIRONMENT && !cache.hidden)
        .sort((a, b) => b.id - a.id)
        .filter((cache) => (seen.has(cache.id) ? false : seen.add(cache.id)))
        .map(describe);
}

async function resolveCache(cacheId) {
    const caches = await listCaches();

    if (cacheId !== undefined) {
        const wanted = caches.find((cache) => cache.cacheId === Number(cacheId));
        if (wanted === undefined) {
            throw new Error(`openrs2 has no ${GAME} ${ENVIRONMENT} cache ${cacheId}`);
        }
        return { cache: wanted, newest: caches[0], withoutNames: [] };
    }

    const withoutNames = [];
    for (const cache of caches.slice(0, CANDIDATES)) {
        if (await hasAssetNames(cache.cacheId)) {
            return { cache, newest: caches[0], withoutNames };
        }
        withoutNames.push(cache.cacheId);
    }

    throw new Error(`none of the newest ${CANDIDATES} ${GAME} ${ENVIRONMENT} caches carry archive 67`);
}

async function readTables(cacheId) {
    const tables = new Map();
    for (const entry of ASSET_GROUPS) {
        const names = await readAssetNames(cacheId, entry.group);
        if (names !== undefined) {
            tables.set(entry.table, names);
        }
    }
    if (tables.size === 0) {
        throw new Error(`cache ${cacheId} holds no asset names`);
    }
    return tables;
}

function toConstantName(gameval) {
    return gameval.replace(/^_+/, "").replace(/:/g, "__").toUpperCase();
}

function collectNames(entries) {
    const byName = new Map();
    const collisions = [];
    let skipped = 0;

    for (const [key, gameval] of entries) {
        if (typeof gameval !== "string" || gameval.length === 0) {
            skipped += 1;
            continue;
        }
        const name = toConstantName(gameval);
        if (!/^[A-Z0-9_]+$/.test(name)) {
            skipped += 1;
            continue;
        }
        const seen = byName.get(name);
        if (seen !== undefined) {
            collisions.push({ name, kept: seen.gameval, dropped: gameval });
            continue;
        }
        byName.set(name, { gameval, key });
    }

    return { names: [...byName.keys()].sort(), collisions, skipped };
}

module.exports = { ASSET_GROUPS, ENVIRONMENT, collectNames, readTables, resolveCache, toConstantName };
