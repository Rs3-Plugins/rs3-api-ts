// node scripts/release.js [--dry-run] [--tag <dist-tag>] [--allow-dirty] [--no-build]
//
// Publishes core first, then extended, then the CLI: each one depends on the
// previous, so a half-published set would leave `npm install rs3-api-ts` broken.
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const packages = [
    ["rs3-api-core", path.join(root, "packages", "core")],
    ["rs3-api-extended", path.join(root, "packages", "extended")],
    ["rs3-api-prettyui", path.join(root, "packages", "prettyui")],
    ["rs3-api-ts", path.join(root, "packages", "cli")],
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const allowDirty = args.includes("--allow-dirty");
const build = !args.includes("--no-build");
const tag = args.includes("--tag") ? args[args.indexOf("--tag") + 1] : "latest";

function fail(message, ...hints) {
    console.error(`error: ${message}`);
    for (const hint of hints) {
        console.error(`  ${hint}`);
    }
    process.exit(1);
}

if (tag === undefined || !/^[A-Za-z][\w.-]*$/.test(tag)) {
    fail("--tag needs a dist-tag starting with a letter", "for example: --tag next");
}

function run(command, cwd) {
    execSync(command, { cwd: cwd ?? root, stdio: "inherit" });
}

function capture(command) {
    return execSync(command, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function version(dir) {
    return JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).version;
}

const target = version(root);
for (const [name, dir] of packages) {
    if (version(dir) !== target) {
        fail(`${name} is ${version(dir)} but the workspace is ${target}`, `set every version at once: node scripts/version.js ${target}`);
    }
}

if (!allowDirty) {
    if (capture("git status --porcelain") !== "") {
        fail("the working tree has uncommitted changes", "commit them so the tag matches what was published", "or pass --allow-dirty if that is deliberate");
    }
}

if (!dryRun) {
    try {
        console.log(`publishing as ${capture("npm whoami")}`);
    } catch {
        fail("not logged in to the npm registry", "run `npm login` first", "in CI, set NODE_AUTH_TOKEN instead");
    }

    for (const [name] of packages) {
        // A brand new package 404s; a known package with an unknown version exits
        // 0 and prints nothing, so only real output means the version is taken.
        let published = "";
        try {
            published = capture(`npm view ${name}@${target} version`);
        } catch {
            published = "";
        }
        if (published !== "") {
            fail(`${name}@${target} is already on the registry`, "published versions cannot be replaced, so pick a new one", "node scripts/version.js <next version>");
        }
    }
}

if (build) {
    run("npm run build");
    run("npm test");
}

for (const [name, dir] of packages) {
    console.log(`\n--- ${name}@${target}${dryRun ? " (dry run)" : ""}`);
    run(`npm publish --access public --tag ${tag}${dryRun ? " --dry-run" : ""}`, dir);
}

console.log(`
${dryRun ? "dry run finished, nothing was published" : `published ${target}`}

  npm install rs3-api-ts${tag === "latest" ? "" : `@${tag}`}
`);
