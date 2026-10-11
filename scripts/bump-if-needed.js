// node scripts/bump-if-needed.js
//
// Compares the workspace version against what's actually on npm. If they
// match, nobody bumped the version for this release yet, so pick the next
// patch automatically. If they differ, someone already set the version we
// want (e.g. a manual minor/major bump), so leave it alone.
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const PACKAGE_NAME = "rs3-api-ts"; // all three packages share one version, this one is enough to check

function setOutput(name, value) {
    const file = process.env.GITHUB_OUTPUT;
    if (file) {
        fs.appendFileSync(file, `${name}=${value}\n`);
    }
    console.log(`${name}=${value}`);
}

function currentVersion() {
    return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
}

function lastReleasedVersion() {
    try {
        return execSync(`npm view ${PACKAGE_NAME} version`, { encoding: "utf8" }).trim();
    } catch {
        return ""; // not published yet
    }
}

function nextPatch(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
    if (!match) {
        throw new Error(`cannot auto-bump pre-release version ${version}, set the next version manually with scripts/version.js`);
    }
    const [, major, minor, patch] = match;
    return `${major}.${minor}.${Number(patch) + 1}`;
}

const version = currentVersion();
const released = lastReleasedVersion();

if (version !== released) {
    console.log(`${PACKAGE_NAME}@${version} was not released yet, keeping it`);
    setOutput("version", version);
    setOutput("bumped", "false");
} else {
    const next = nextPatch(version);
    console.log(`${PACKAGE_NAME}@${version} is already released, bumping to ${next}`);
    execSync(`node "${path.join(root, "scripts", "version.js")}" ${next}`, { cwd: root, stdio: "inherit" });
    execSync("npm install", { cwd: root, stdio: "inherit" });
    setOutput("version", next);
    setOutput("bumped", "true");
}
