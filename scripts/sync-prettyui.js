#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const source = require("./lib/prettyui-source");

const root = path.resolve(__dirname, "..");
const packageDir = path.join(root, "packages", "prettyui");
const sourceJsonPath = path.join(packageDir, "data", "source.json");
const sourceInfo = JSON.parse(fs.readFileSync(sourceJsonPath, "utf8"));

const API_BASE = (process.env.MODIO_API_BASE ?? "https://mod.io/v1").replace(/\/$/, "");
const GAME_NAME_ID = process.env.MODIO_GAME_NAME_ID ?? "runescape";
const UPLOAD_SLACK_MS = 6 * 60 * 60 * 1000;

function trackUpstreamVersion(upstream) {
    const series = /^(\d+)\.(\d+)\./.exec(upstream);
    if (series === null) {
        console.log(`PrettyUI ${upstream} is not a major.minor.patch version, leaving the package version alone`);
        return;
    }
    const manifestPath = path.join(packageDir, "package.json");
    const text = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(text);
    if (manifest.version.startsWith(`${series[1]}.${series[2]}.`)) {
        console.log(`rs3-api-prettyui ${manifest.version} already tracks the ${series[1]}.${series[2]} series`);
        return;
    }
    const next = `${series[1]}.${series[2]}.0`;
    console.log(`rs3-api-prettyui ${manifest.version} -> ${next}, following PrettyUI ${upstream}`);
    manifest.version = next;
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, text.startsWith("{\n    ") ? 4 : 2)}\n`);
}

const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const checkOnly = args.includes("--check-only");
const force = args.includes("--force");
const sourceDir = path.resolve(flag("--source") ?? path.join(root, ".vendor", "prettyui"));
const reportPath = flag("--out") !== undefined ? path.resolve(flag("--out")) : undefined;
const diffRange = flag("--diff");

function output(name, value) {
    const file = process.env.GITHUB_OUTPUT;
    if (file) {
        fs.appendFileSync(file, `${name}=${String(value)}\n`);
    }
    console.log(`  ${name}=${String(value)}`);
}

async function get(endpoint, query = {}) {
    const url = new URL(`${API_BASE}${endpoint}`);
    for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
    }
    const response = await fetch(url, { headers: { Accept: "application/json", "x-modio-origin": "web" } });
    if (!response.ok) {
        throw new Error(`GET ${endpoint} -> HTTP ${response.status}`);
    }
    return response.json();
}

async function latestModfile() {
    const files = await get(`/games/@${GAME_NAME_ID}/mods/${sourceInfo.modio.id}/files`, { _sort: "-date_added", _limit: "1" });
    const file = files.data?.[0];
    if (file === undefined) {
        throw new Error("mod.io lists no files for PrettyUI");
    }
    return {
        id: file.id,
        version: String(file.version ?? "").trim(),
        dateAdded: new Date(file.date_added * 1000).toISOString(),
        changelog: typeof file.changelog === "string" ? file.changelog.trim() : "",
    };
}

function resolveCommit(modfile) {
    const uploaded = Date.parse(modfile.dateAdded) + UPLOAD_SLACK_MS;
    const candidates = source.commitsOnMain(sourceDir).filter((commit) => Date.parse(commit.date) <= uploaded);
    for (const commit of candidates) {
        const manifest = source.fileAt(sourceDir, commit.sha, "plugin.json");
        if (manifest === undefined) {
            continue;
        }
        let version;
        try {
            version = JSON.parse(manifest).version;
        } catch {
            continue;
        }
        if (version === modfile.version) {
            return commit;
        }
    }
    return undefined;
}

function runCheck(ref, extra = []) {
    const result = spawnSync(process.execPath, [path.join(__dirname, "check-prettyui-types.js"), "--source", sourceDir, "--ref", ref, ...extra], {
        cwd: root,
        encoding: "utf8",
    });
    return { ok: result.status === 0, text: `${result.stdout}${result.stderr}`.trim() };
}

function signatures(ref) {
    const out = new Map();
    for (const file of source.filesAt(sourceDir, ref, ["src", "main.lua"])) {
        if (!file.endsWith(".lua") || file.startsWith("tests/")) continue;
        const text = source.fileAt(sourceDir, ref, file) ?? "";
        for (const m of text.matchAll(/^function (\w+)([.:])(\w+)\(([^)]*)\)/gm)) {
            if (m[3].startsWith("_")) continue;
            out.set(`${file} ${m[1]}${m[2]}${m[3]}`, m[4].replace(/\s+/g, " ").trim());
        }
    }
    return out;
}

function sourceChanges(from, to) {
    const before = signatures(from);
    const after = signatures(to);
    const lines = [];
    for (const [key, params] of after) {
        if (!before.has(key)) lines.push(`- added \`${key}(${params})\``);
        else if (before.get(key) !== params) lines.push(`- changed \`${key}(${before.get(key)})\` to \`(${params})\``);
    }
    for (const key of before.keys()) if (!after.has(key)) lines.push(`- removed \`${key}\``);
    const stat = source.shortStat(sourceDir, from, to, ["src", "main.lua", "plugin.json"]);
    return { lines, stat };
}

function declarationChanges() {
    try {
        const { execFileSync } = require("node:child_process");
        const stat = execFileSync("git", ["-C", root, "diff", "--stat", "--", "packages/prettyui"], { encoding: "utf8" }).trim();
        const untracked = execFileSync("git", ["-C", root, "ls-files", "--others", "--exclude-standard", "packages/prettyui"], { encoding: "utf8" }).trim();
        return [stat, untracked === "" ? "" : `new files:\n${untracked}`].filter((s) => s !== "").join("\n");
    } catch {
        return "";
    }
}

function writeReport(lines) {
    if (reportPath === undefined) {
        return;
    }
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
    console.log(`report written to ${path.relative(root, reportPath)}`);
}

function reportDiff(range) {
    const [from, to] = range.split("..");
    if (from === undefined || to === undefined || from === "" || to === "") {
        throw new Error("--diff takes <from>..<to>");
    }
    source.ensureClone(sourceDir, sourceInfo.repository);
    const changes = sourceChanges(from, to);
    const lines = [`## Lua changes ${from.slice(0, 12)} -> ${to.slice(0, 12)}`, ""];
    if (changes.stat !== "") lines.push("```", changes.stat, "```", "");
    lines.push(...(changes.lines.length > 0 ? changes.lines : ["- no public function signatures changed"]));
    for (const line of lines) console.log(line);
    writeReport(lines);
}

async function main() {
    if (diffRange !== undefined) {
        reportDiff(diffRange);
        return;
    }
    const previous = sourceInfo.modfile ?? { id: null, version: sourceInfo.pluginVersion };
    const modfile = await latestModfile();
    console.log(`mod.io: PrettyUI ${modfile.version} (file ${modfile.id}, uploaded ${modfile.dateAdded})`);
    console.log(`recorded: PrettyUI ${previous.version} (file ${previous.id ?? "unknown"})`);
    output("version", modfile.version);
    output("previousVersion", previous.version);

    if (modfile.id === previous.id && !force) {
        console.log("up to date");
        output("updated", "false");
        return;
    }
    output("updated", "true");
    if (checkOnly) {
        return;
    }

    source.ensureClone(sourceDir, sourceInfo.repository);
    const commit = resolveCommit(modfile);
    const report = [
        `## PrettyUI ${previous.version} -> ${modfile.version}`,
        "",
        `mod.io uploaded [file ${modfile.id}](${sourceInfo.modio.profile_url ?? `https://mod.io/g/${GAME_NAME_ID}/m/${sourceInfo.modio.name_id}`}) on ${modfile.dateAdded}.`,
        "",
    ];
    if (modfile.changelog !== "") {
        report.push("### Changelog", "", modfile.changelog, "");
    }

    if (commit === undefined) {
        output("resolved", "false");
        output("drift", "true");
        report.push(
            "### Source",
            "",
            `No commit on ${sourceInfo.repository} carries version ${modfile.version} in plugin.json before the upload time, so the source could not be matched. ` +
                "Either the GitHub repository is behind the mod.io release or the version was changed without a commit. Check by hand and update packages/prettyui/data/source.json.",
        );
        writeReport(report);
        process.exitCode = 2;
        return;
    }

    output("resolved", "true");
    output("commit", commit.sha);
    console.log(`source: ${commit.sha.slice(0, 12)} ${commit.date} ${commit.subject}`);
    report.push("### Source", "", `${sourceInfo.repository}/commit/${commit.sha} (${commit.date}: ${commit.subject})`, "");
    if (sourceInfo.commit && sourceInfo.commit !== commit.sha) {
        const changes = sourceChanges(sourceInfo.commit, commit.sha);
        report.push(`### Lua changes since ${sourceInfo.commit.slice(0, 12)}`, "");
        if (changes.stat !== "") report.push("```", changes.stat, "```", "");
        report.push(...(changes.lines.length > 0 ? changes.lines : ["- no public function signatures changed"]), "");
        for (const line of changes.lines) console.log(line);
    }

    const updated = {
        ...sourceInfo,
        pluginVersion: modfile.version,
        commit: commit.sha,
        commitDate: commit.date,
        modfile: { id: modfile.id, version: modfile.version, dateAdded: modfile.dateAdded },
    };
    fs.writeFileSync(sourceJsonPath, `${JSON.stringify(updated, null, 2)}\n`);
    console.log(`updated ${path.relative(root, sourceJsonPath)}`);
    trackUpstreamVersion(modfile.version);

    let check = runCheck(commit.sha);
    if (check.ok) {
        report.push("### Declaration check", "", "```", check.text, "```", "", "The declarations already match the new source. Safe to merge once CI passes.");
    } else {
        report.push("### Declaration check before updating", "", "```", check.text, "```", "");
        const fixed = runCheck(commit.sha, ["--fix"]);
        console.log(fixed.text);
        report.push("### Declarations updated from the Lua", "", "```", declarationChanges() || "no files changed", "```", "");
        check = runCheck(commit.sha);
        report.push("### Declaration check after updating", "", "```", check.text, "```", "");
        if (check.ok) report.push("Every difference was applied to the declarations automatically. Review the diff for types that came out as `unknown` and refine them if you want, then merge.");
        else report.push("Some differences could not be applied automatically; the mismatches listed above need a person before this can merge.");
    }
    output("drift", check.ok ? "false" : "true");
    writeReport(report);
}

main().catch((error) => {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
