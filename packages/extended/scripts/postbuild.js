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

for (const required of ["index.lua", "index.d.ts", "plugin.lua", "plugin.d.ts", "vars.lua", "vars.d.ts"]) {
    if (!fs.existsSync(path.join(out, required))) {
        console.error(`postbuild: expected dist/${required} to exist`);
        process.exitCode = 1;
    }
}
