const zlib = require("node:zlib");

const OPENRS2_BASE = (process.env.OPENRS2_BASE ?? "https://archive.openrs2.org").replace(/\/$/, "");
const SCOPE = "runescape";
const ASSET_NAMES_ARCHIVE = 67;

let bzip2;

function decompress(raw) {
    const type = raw[0];
    const compressedSize = raw.readInt32BE(1);

    if (type === 0) {
        return raw.subarray(5, 5 + compressedSize);
    }

    const body = raw.subarray(9);

    if (type === 1) {
        bzip2 = bzip2 ?? require("seek-bzip");
        return bzip2.decode(Buffer.concat([Buffer.from("BZh1"), body]));
    }

    if (type === 2) {
        return zlib.gunzipSync(body);
    }

    throw new Error(`js5 container uses unsupported compression ${type}`);
}

function readNameTable(buffer) {
    let at = 0;
    const int = () => {
        const value = buffer.readInt32BE(at);
        at += 4;
        return value;
    };

    const packType = int();
    if (packType !== 1 && packType !== 2) {
        throw new Error(`unknown asset name pack type ${packType}`);
    }

    const count = int();
    const ids = new Array(count);
    const offsets = new Array(count);
    for (let i = 0; i < count; i += 1) {
        ids[i] = packType === 1 ? i : int();
        offsets[i] = int();
    }

    const tableStart = at;
    const names = new Map();

    for (let i = 0; i < count; i += 1) {
        if (offsets[i] === -1) {
            continue;
        }
        const start = tableStart + offsets[i];
        let end = start;
        while (end < buffer.length && buffer[end] !== 0 && buffer[end] !== 10) {
            end += 1;
        }
        names.set(ids[i], buffer.toString("latin1", start, end).toLowerCase());
    }

    return names;
}

async function fetchGroup(cacheId, archive, group) {
    const url = `${OPENRS2_BASE}/caches/${SCOPE}/${cacheId}/archives/${archive}/groups/${group}.dat`;
    const response = await fetch(url);
    if (response.status === 404) {
        return undefined;
    }
    if (!response.ok) {
        throw new Error(`GET ${url} -> ${response.status} ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
}

async function hasAssetNames(cacheId) {
    return (await fetchGroup(cacheId, ASSET_NAMES_ARCHIVE, 0)) !== undefined;
}

async function readAssetNames(cacheId, group) {
    const raw = await fetchGroup(cacheId, ASSET_NAMES_ARCHIVE, group);
    return raw === undefined ? undefined : readNameTable(decompress(raw));
}

module.exports = { ASSET_NAMES_ARCHIVE, OPENRS2_BASE, SCOPE, decompress, fetchGroup, hasAssetNames, readAssetNames, readNameTable };
