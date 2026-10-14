// node scripts/publish-local.js link|unlink
//
// Linking puts rs3-plugin on the PATH and lets init point new plugins at this checkout.
const { execSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const packages = [
    ["rs3-api-core", path.join(root, "packages", "core")],
    ["rs3-api-extended", path.join(root, "packages", "extended")],
    ["rs3-api-prettyui", path.join(root, "packages", "prettyui")],
    ["rs3-api-ts", path.join(root, "packages", "cli")],
];

const mode = process.argv[2];
if (mode !== "link" && mode !== "unlink") {
    console.error("usage: node scripts/publish-local.js link|unlink");
    process.exit(1);
}

for (const [name, dir] of packages) {
    if (mode === "link") {
        execSync("npm link --no-audit --no-fund --loglevel=error", { cwd: dir, stdio: "inherit" });
        console.log(`linked ${name} from ${path.relative(root, dir)}`);
    } else {
        execSync(`npm unlink -g ${name} --loglevel=error`, { cwd: dir, stdio: "inherit" });
        console.log(`unlinked ${name}`);
    }
}

if (mode === "link") {
    console.log(`
rs3-api-core, rs3-api-extended, rs3-api-prettyui and rs3-api-ts are linked globally from ${root}

  rs3-plugin --help                    the CLI is on your PATH
  rs3-plugin init my-plugin            scaffolds a plugin whose package.json points at this checkout (file:...)
  cd my-plugin && npm install && npm run build

Rebuild with "npm run build" and every linked plugin sees the change on its next build.
Undo with "npm run unpublish:local".
`);
}
