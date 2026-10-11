// node scripts/version.js <version>
//
// The three packages depend on each other by exact range, so they ship as a set
// and every one of their manifests carries the same version. examples/hello is
// not one of those packages - it has its own plugin version (synced into its
// plugin.json via rs3.syncVersion) - so only its pinned SDK devDependencies
// get bumped, not its own version field.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sdkManifests = ["package.json", "packages/core/package.json", "packages/extended/package.json", "packages/cli/package.json"].map((p) => path.join(root, p));
const dependentManifests = ["examples/hello/package.json"].map((p) => path.join(root, p));

const SDK_PACKAGES = ["rs3-api-core", "rs3-api-extended", "rs3-api-ts"];
const DEP_FIELDS = ["dependencies", "devDependencies", "peerDependencies"];

const version = process.argv[2];
if (version === undefined || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
    console.error("usage: node scripts/version.js <version>   (for example 0.2.0 or 0.2.0-beta.1)");
    process.exit(1);
}

for (const file of [...sdkManifests, ...dependentManifests]) {
    const text = fs.readFileSync(file, "utf8");
    const pkg = JSON.parse(text);
    if (sdkManifests.includes(file)) {
        pkg.version = version;
    }

    for (const field of DEP_FIELDS) {
        const deps = pkg[field];
        if (deps === undefined) {
            continue;
        }
        for (const name of SDK_PACKAGES) {
            if (deps[name] !== undefined && !deps[name].startsWith("file:")) {
                deps[name] = `^${version}`;
            }
        }
    }

    const indent = text.startsWith("{\n    ") ? 4 : 2;
    fs.writeFileSync(file, `${JSON.stringify(pkg, null, indent)}\n`);
    console.log(sdkManifests.includes(file) ? `${path.relative(root, file)} -> ${version}` : `${path.relative(root, file)} -> SDK devDependencies bumped to ^${version} (own version left alone)`);
}

console.log(`
Next:
  npm install                 refresh the lockfile
  npm run release             build, test and publish all three
  git commit -am "release ${version}" && git tag v${version} && git push --follow-tags
`);
