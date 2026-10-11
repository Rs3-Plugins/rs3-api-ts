import * as fs from "node:fs";
import * as path from "node:path";
import { CliError } from "./errors";
import { loadCatalog, parseDependencies, toManifestDependencies, type DependencyEntry, type LibraryInfo } from "./libraries";
import { findPermission, permissionNames } from "./permissions";
import { confirm, multiSelect, text } from "./prompt";
import { sdkRoot } from "./project";

export interface InitAnswers {
    name: string;
    requiredPermissions: string[];
    optionalPermissions: string[];
    /** Comma separated, each entry `name=url` or a bare url taking api, api2 and so on. */
    urls: string | undefined;
    requiredDependencies: DependencyEntry[];
    optionalDependencies: DependencyEntry[];
    settingsIcon: boolean;
    ribbonIcon: boolean;
    contactEmail: string | undefined;
    version: string;
    syncVersion: boolean;
    /** `file:` paths to this checkout, or `^version` ranges. */
    sdkSource: "local" | "registry";
}

export interface InitOptions {
    cwd: string;
    answers: Partial<InitAnswers>;
    /** When false, defaults fill whatever the flags did not supply. */
    interactive: boolean;
}

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const RENAMES: Record<string, string> = {
    _gitignore: ".gitignore",
};

const DEFAULTS = {
    version: "0.1.0",
    syncVersion: true,
};

export async function init(options: InitOptions): Promise<void> {
    const answers = await collectAnswers(options.answers, options.interactive);

    const target = path.join(options.cwd, answers.name);
    if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
        throw new CliError(`${answers.name} already exists here and is not empty`, [
            `nothing was written to ${target}`,
            "scaffold under a different name, or empty that folder first",
        ]);
    }

    const written: string[] = [];
    const write = (relative: string, content: string) => {
        const to = path.join(target, relative);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.writeFileSync(to, content);
        written.push(relative);
    };

    const dependencies = sdkDependencies(answers, target);
    write("package.json", `${JSON.stringify(packageJson(answers, dependencies), null, 2)}\n`);
    write("plugin.json", `${JSON.stringify(pluginJson(answers), null, 2)}\n`);
    copyTemplates(path.join(sdkRoot(), "templates"), answers, write);

    console.log(`\ncreated ${answers.name}/ with ${written.length} files`);
    if (answers.sdkSource === "local") {
        console.log(`SDK packages are referenced from this checkout (${dependencies["rs3-api-ts"]}); pass --registry to depend on the published packages instead`);
    }
    if (answers.syncVersion) {
        console.log("plugin.json follows package.json's version: bump with `npm version patch|minor|major`");
    }
    console.log("\nnext steps:");
    console.log(`  cd ${answers.name}`);
    console.log("  npm install");
    console.log("  npm run build          # readable Lua in dist/");
    console.log("  npm run dev -- --out <your client's plugins folder>");
}

async function collectAnswers(given: Partial<InitAnswers>, interactive: boolean): Promise<InitAnswers> {
    validatePermissionList(given.requiredPermissions, "--permissions");
    validatePermissionList(given.optionalPermissions, "--optional-permissions");

    const name = await resolveText(interactive, given.name, "Plugin name (folder, package and plugin id)", undefined, validateName, NAME_HINT);

    let required = given.requiredPermissions;
    let optional = given.optionalPermissions;
    if (required === undefined && optional === undefined && interactive) {
        required = await selectPermissions("Permissions the plugin needs", permissionNames(), []);
        const remaining = permissionNames().filter((p) => !required!.includes(p));
        optional = remaining.length > 0 ? await selectPermissions("Optional permissions (the user can grant or refuse them)", remaining, []) : [];
    }
    required = required ?? [];
    optional = (optional ?? []).filter((p) => !required!.includes(p));

    let urls = given.urls;
    const needsUrls = [...required, ...optional].some((p) => findPermission(p)?.needsUrls === true);
    if (urls !== undefined) {
        const error = validateUrls(urls);
        if (error !== undefined) {
            throw new CliError(`--urls: ${error}`, [
                "comma separated, each entry either a url or name=url",
                'for example: --urls "https://api.example.com/, wiki=https://runescape.wiki/"',
            ]);
        }
    } else if (needsUrls) {
        urls = await resolveText(
            interactive,
            undefined,
            "URLs the plugin may call, comma separated (name=url or just url)",
            "https://example.com/",
            validateUrls,
        );
    }

    let requiredDeps = given.requiredDependencies;
    let optionalDeps = given.optionalDependencies;
    if (requiredDeps === undefined && optionalDeps === undefined && interactive) {
        const catalog = loadCatalog();
        if (catalog.libraries.length > 0) {
            const stamp = catalog.generatedAt !== null ? `list from ${catalog.generatedAt.slice(0, 10)}` : "hand-seeded list";
            requiredDeps = await selectLibraries(`Library plugins from mod.io the plugin requires (${stamp})`, catalog.libraries);
            const chosen = new Set(requiredDeps.map((d) => d.name));
            const remaining = catalog.libraries.filter((lib) => !chosen.has(lib.name_id));
            optionalDeps = remaining.length > 0 ? await selectLibraries("Optional library plugins (used when installed)", remaining) : [];
        }
    }
    requiredDeps = requiredDeps ?? [];
    const requiredNames = new Set(requiredDeps.map((d) => d.name));
    optionalDeps = (optionalDeps ?? []).filter((d) => !requiredNames.has(d.name));

    let settingsIcon = given.settingsIcon;
    let ribbonIcon = given.ribbonIcon;
    if (settingsIcon === undefined && ribbonIcon === undefined && interactive) {
        const picked = await multiSelect("Client integration", [
            { label: "settings icon", hint: "hasSettingsIcon: the plugin appears in the settings panel" },
            { label: "ribbon icon", hint: "hasRibbonIcon: the plugin gets a button on the ribbon" },
        ]);
        settingsIcon = picked[0];
        ribbonIcon = picked[1];
    }
    settingsIcon = settingsIcon ?? false;
    ribbonIcon = ribbonIcon ?? false;

    let contactEmail = given.contactEmail;
    if (contactEmail !== undefined) {
        const error = validateEmail(contactEmail);
        if (error !== undefined) {
            throw new CliError(`--contact-email: ${error}`, ["for example: --contact-email you@example.com"]);
        }
    } else if (interactive) {
        contactEmail = await text("Contact email for plugin.json (enter to skip)", "", validateEmail);
    }
    if (contactEmail === "") {
        contactEmail = undefined;
    }

    const version = await resolveText(interactive, given.version, "Version", DEFAULTS.version, validateVersion, [
        "for example: --plugin-version 1.0.0",
    ]);
    const syncVersion = await resolveBoolean(
        interactive,
        given.syncVersion,
        "Should plugin.json's version follow package.json's version?",
        DEFAULTS.syncVersion,
    );

    const sdkSource = given.sdkSource ?? (isInstalledFromRegistry() ? "registry" : "local");

    return {
        name,
        requiredPermissions: required,
        optionalPermissions: optional,
        urls,
        requiredDependencies: requiredDeps,
        optionalDependencies: optionalDeps,
        settingsIcon,
        ribbonIcon,
        contactEmail,
        version,
        syncVersion,
        sdkSource,
    };
}

function validateEmail(value: string): string | undefined {
    if (value === "") {
        return undefined;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `"${value}" does not look like an email address`;
    }
    return undefined;
}

async function selectLibraries(question: string, libraries: LibraryInfo[]): Promise<DependencyEntry[]> {
    const items = libraries.map((lib) => ({
        label: lib.name_id,
        hint: `${lib.name}${lib.summary !== "" ? ` - ${truncate(lib.summary, 70)}` : ""} (id ${lib.id})`,
    }));
    const picked = await multiSelect(question, items);
    return libraries.filter((_, i) => picked[i]).map((lib) => ({ name: lib.name_id, id: lib.id }));
}

function truncate(text: string, max: number): string {
    return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function dependenciesFromFlag(value: string | undefined, flag: string): DependencyEntry[] | undefined {
    if (value === undefined) {
        return undefined;
    }
    try {
        return parseDependencies(value);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const hint = error instanceof CliError ? error.hint : undefined;
        throw new CliError(`${flag}: ${message}`, hint);
    }
}

function isInstalledFromRegistry(): boolean {
    return sdkRoot().split(path.sep).includes("node_modules");
}

const SDK_PACKAGES = ["rs3-api-core", "rs3-api-extended", "rs3-api-ts"] as const;

/** Follows the workspace and npm link symlinks to the real folder. */
function packageRoot(name: (typeof SDK_PACKAGES)[number]): string {
    if (name === "rs3-api-ts") {
        return sdkRoot();
    }
    return fs.realpathSync(path.dirname(require.resolve(`${name}/package.json`)));
}

function sdkDependencies(answers: InitAnswers, target: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const name of SDK_PACKAGES) {
        const root = packageRoot(name);
        if (answers.sdkSource === "registry") {
            const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as { version: string };
            out[name] = `^${pkg.version}`;
        } else {
            out[name] = `file:${path.relative(target, root).split(path.sep).join("/")}`;
        }
    }
    return out;
}

/** `"https://a.example/, backend=https://b.example/"` -> `{ api: ..., backend: ... }` */
export function parseUrls(input: string): Record<string, string> {
    const out: Record<string, string> = {};
    let unnamed = 0;
    for (const raw of input.split(",")) {
        const entry = raw.trim();
        if (entry === "") {
            continue;
        }
        const eq = entry.indexOf("=");
        let name: string;
        let url: string;
        if (eq > 0 && !/^[a-z][a-z0-9+.-]*:\/\//i.test(entry)) {
            name = entry.slice(0, eq).trim();
            url = entry.slice(eq + 1).trim();
        } else {
            unnamed++;
            name = unnamed === 1 ? "api" : `api${unnamed}`;
            url = entry;
        }
        out[name] = url;
    }
    return out;
}

function validateUrls(input: string): string | undefined {
    const seen = new Set<string>();
    let unnamed = 0;
    for (const raw of input.split(",")) {
        const entry = raw.trim();
        if (entry === "") {
            continue;
        }
        const eq = entry.indexOf("=");
        let name: string;
        let url: string;
        if (eq > 0 && !/^[a-z][a-z0-9+.-]*:\/\//i.test(entry)) {
            name = entry.slice(0, eq).trim();
            url = entry.slice(eq + 1).trim();
            if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(name)) {
                return `"${name}" is not a valid url name (letters, digits, _ and -)`;
            }
        } else {
            unnamed++;
            name = unnamed === 1 ? "api" : `api${unnamed}`;
            url = entry;
        }
        if (seen.has(name)) {
            return `url name "${name}" is used twice`;
        }
        seen.add(name);
        const error = validateUrl(url);
        if (error !== undefined) {
            return error;
        }
    }
    if (seen.size === 0) {
        return "enter at least one URL";
    }
    return undefined;
}

async function selectPermissions(question: string, names: string[], preselected: string[]): Promise<string[]> {
    const items = names.map((name) => {
        const info = findPermission(name);
        return { label: name, hint: info?.description };
    });
    const picked = await multiSelect(question, items, names.map((n) => preselected.includes(n)));
    return names.filter((_, i) => picked[i]);
}

function validatePermissionList(list: string[] | undefined, flag: string): void {
    if (list === undefined) {
        return;
    }
    for (const name of list) {
        if (findPermission(name) === undefined) {
            throw new CliError(`${flag}: "${name}" is not a permission the client knows`, [
                `valid permissions: ${permissionNames().join(", ")}`,
                "the client refuses to load a plugin that asks for anything else",
            ]);
        }
    }
}

async function resolveText(
    interactive: boolean,
    given: string | undefined,
    question: string,
    fallback: string | undefined,
    validate: (value: string) => string | undefined,
    hint?: string[],
): Promise<string> {
    if (given !== undefined) {
        const error = validate(given);
        if (error !== undefined) {
            throw new CliError(error, hint);
        }
        return given;
    }
    if (!interactive) {
        if (fallback === undefined) {
            const label = question.replace(/\s*\(.*\)\s*$/, "").toLowerCase();
            throw new CliError(`${label} is required`, hint ?? ["pass it on the command line, or run without --yes to be asked"]);
        }
        return fallback;
    }
    return text(question, fallback, validate);
}

async function resolveBoolean(interactive: boolean, given: boolean | undefined, question: string, fallback: boolean): Promise<boolean> {
    if (given !== undefined) {
        return given;
    }
    if (!interactive) {
        return fallback;
    }
    return confirm(question, fallback);
}

function validateName(value: string): string | undefined {
    if (!NAME_PATTERN.test(value)) {
        return `"${value}" must be lowercase letters, digits and dashes, starting with a letter or digit`;
    }
    return undefined;
}

const NAME_HINT = [
    "it becomes the folder, the npm package name and the plugin id, so: my-plugin",
    "pass it as an argument: rs3-plugin init my-plugin",
];

function validateVersion(value: string): string | undefined {
    if (!VERSION_PATTERN.test(value)) {
        return `"${value}" must be three numbers separated by dots, like 0.1.0`;
    }
    return undefined;
}

function validateUrl(value: string): string | undefined {
    try {
        const url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return "the URL must start with http:// or https://";
        }
        return undefined;
    } catch {
        return `"${value}" is not a valid URL`;
    }
}

function packageJson(answers: InitAnswers, sdkDependencies: Record<string, string>): Record<string, unknown> {
    return {
        name: answers.name,
        version: answers.version,
        private: true,
        scripts: {
            build: "rs3-plugin build",
            dev: "rs3-plugin dev",
        },
        rs3: {
            syncVersion: answers.syncVersion,
        },
        devDependencies: sdkDependencies,
    };
}

function pluginJson(answers: InitAnswers): Record<string, unknown> {
    const manifest: Record<string, unknown> = {
        name: answers.name,
        version: answers.version,
        dependencies: {},
        requiredDependencies: toManifestDependencies(answers.requiredDependencies),
        optionalDependencies: toManifestDependencies(answers.optionalDependencies),
        requiredPermissions: answers.requiredPermissions,
        optionalPermissions: answers.optionalPermissions,
        urls: answers.urls !== undefined ? parseUrls(answers.urls) : {},
        resources: {},
        hasSettingsIcon: answers.settingsIcon,
        hasRibbonIcon: answers.ribbonIcon,
    };
    if (answers.contactEmail !== undefined) {
        manifest.contactEmailAddress = answers.contactEmail;
    }
    return manifest;
}

function copyTemplates(templates: string, answers: InitAnswers, write: (relative: string, content: string) => void): void {
    const replacements: Record<string, string> = {
        __NAME__: answers.name,
    };
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const from = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(from);
                continue;
            }
            // Templates npm or git would act on inside this package are stored with a leading
            // underscore: _tsconfig.json -> tsconfig.json, _gitignore -> .gitignore.
            const relativeDir = path.dirname(path.relative(templates, from));
            const destName = RENAMES[entry.name] ?? (entry.name.startsWith("_") ? entry.name.slice(1) : entry.name);
            let content = fs.readFileSync(from, "utf8");
            for (const [token, value] of Object.entries(replacements)) {
                content = content.split(token).join(value);
            }
            write(path.join(relativeDir, destName), content);
        }
    };
    walk(templates);
}
