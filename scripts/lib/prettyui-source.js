const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function git(dir, args, options = {}) {
    return execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options }).trim();
}

function ensureClone(dir, repository) {
    if (!fs.existsSync(path.join(dir, ".git"))) {
        fs.mkdirSync(path.dirname(dir), { recursive: true });
        console.log(`cloning ${repository} into ${dir}`);
        execFileSync("git", ["clone", "--quiet", repository, dir], { stdio: "inherit" });
    }
    git(dir, ["fetch", "--quiet", "--tags", "origin"]);
    return dir;
}

function checkout(dir, ref) {
    git(dir, ["checkout", "--quiet", "--detach", ref]);
}

function head(dir) {
    return git(dir, ["rev-parse", "HEAD"]);
}

function fileAt(dir, ref, file) {
    try {
        return git(dir, ["show", `${ref}:${file}`]);
    } catch {
        return undefined;
    }
}

function filesAt(dir, ref, paths) {
    const out = git(dir, ["ls-tree", "-r", "--name-only", ref, "--", ...paths]);
    return out === "" ? [] : out.split("\n");
}

function shortStat(dir, from, to, paths) {
    try {
        return git(dir, ["diff", "--stat", `${from}..${to}`, "--", ...paths]);
    } catch {
        return "";
    }
}

function commitsOnMain(dir) {
    const branch = defaultBranch(dir);
    const out = git(dir, ["log", `origin/${branch}`, "--format=%H%x1f%cI%x1f%s"]);
    if (out === "") {
        return [];
    }
    return out.split("\n").map((line) => {
        const [sha, date, subject] = line.split("\x1f");
        return { sha, date, subject };
    });
}

function defaultBranch(dir) {
    try {
        const ref = git(dir, ["symbolic-ref", "refs/remotes/origin/HEAD"]);
        return ref.replace(/^refs\/remotes\/origin\//, "");
    } catch {
        return "main";
    }
}

module.exports = { ensureClone, checkout, head, fileAt, filesAt, shortStat, commitsOnMain, defaultBranch };
