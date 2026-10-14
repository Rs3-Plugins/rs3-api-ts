const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");
const out = path.join(root, "dist");
const ANNOTATION = "/** @noSelfInFile */";

for (const entry of fs.readdirSync(src)) {
    if (entry.endsWith(".d.ts") || entry.endsWith(".lua")) {
        const target = path.join(out, entry);
        if (!fs.existsSync(target)) {
            fs.copyFileSync(path.join(src, entry), target);
        }
    }
}

// Consumers compile against these declarations from node_modules, where noImplicitSelf does
// not reach, so each one needs the annotation exactly once. TypeScript drops it or doubles it.
for (const entry of fs.readdirSync(out)) {
    if (!entry.endsWith(".d.ts")) {
        continue;
    }
    const file = path.join(out, entry);
    const text = fs.readFileSync(file, "utf8").split(`${ANNOTATION}\n`).join("").replace(/^\n+/, "");
    fs.writeFileSync(file, `${ANNOTATION}\n${text}`);
}

const indexLua = path.join(out, "index.lua");
if (fs.existsSync(indexLua)) {
    const lua = fs.readFileSync(indexLua, "utf8");
    if (!lua.includes("_G.var")) {
        console.error("postbuild: expected dist/index.lua to reach the var global through _G");
        process.exitCode = 1;
    } else {
        fs.writeFileSync(indexLua, lua.split("_G.var").join("var"));
    }
}

for (const required of ["index.lua", "index.d.ts"]) {
    if (!fs.existsSync(path.join(out, required))) {
        console.error(`postbuild: expected dist/${required} to exist`);
        process.exitCode = 1;
    }
}
