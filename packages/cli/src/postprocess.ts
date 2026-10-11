const LUA_KEYWORDS = new Set([
    "and", "break", "do", "else", "elseif", "end", "false", "for", "function", "goto", "if", "in",
    "local", "nil", "not", "or", "repeat", "return", "then", "true", "until", "while",
]);

/** Tidies TypeScriptToLua output for release builds. Dev bundles are left alone. */
export function makeReadable(code: string): string {
    let out = code;

    if (!/\bM\b/.test(out.replace(/____exports/g, ""))) {
        out = out.replace(/____exports/g, "M");
    }

    out = out.replace(/\bfor ____, /g, "for _, ");

    // @noSelf tags are copied through from the TypeScript but only mean something to the compiler.
    out = out.replace(/^-- ?\n(?=-- @noSelf)/gm, "").replace(/^-- @noSelf\w*\n/gm, "");

    // local ____rs3_2Dapi_2Dextended = require(...)  ->  local ext = require(...)
    for (const match of out.matchAll(/^local (____[A-Za-z][A-Za-z0-9_]*) = require\("([^"]+)"\)$/gm)) {
        const mangled = match[1];
        const modulePath = match[2];
        const candidate = /rs3-api-extended/.test(modulePath) ? "ext" : mangled.slice(4).replace(/_2D/g, "_");
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(candidate) || LUA_KEYWORDS.has(candidate)) {
            continue;
        }
        const taken = new RegExp(`\\b${candidate}\\b`).test(out.split(mangled).join(""));
        if (!taken) {
            out = out.split(mangled).join(candidate);
        }
    }

    // The client turns require("a.b") into the path a.b.lua, so module paths need slashes.
    out = out.replace(/require\("([^"]+)"\)/g, (_match, modulePath: string) => {
        return `require("${modulePath.replace(/\./g, "/")}")`;
    });

    out = out.replace(/[ \t]+$/gm, "");
    return out.endsWith("\n") ? out : `${out}\n`;
}
