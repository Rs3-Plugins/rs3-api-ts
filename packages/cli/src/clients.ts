import * as fs from "node:fs";
import * as path from "node:path";
import { CliError } from "./errors";

/** Which installed RuneScape client(s) to copy a build into. */
export type ClientChoice = "beta" | "live" | "all";

const CLIENT_FOLDERS = {
    beta: "RuneScape-BETA",
    live: "RuneScape",
} as const;

export const CLIENT_CHOICES: readonly ClientChoice[] = ["beta", "live", "all"];

/** `--client` -> all, `--client beta` -> beta, anything else is an error. */
export function parseClientFlag(value: string | boolean | undefined): ClientChoice | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === true) {
        return "all";
    }
    if (value === "beta" || value === "live" || value === "all") {
        return value;
    }
    throw new CliError(`--client: "${value}" is not a client`, [
        `choose one of: ${CLIENT_CHOICES.join(", ")}`,
        "beta is RuneScape-BETA, live is RuneScape, a bare --client means all",
    ]);
}

/** Where the Jagex launcher keeps the clients: %ProgramData%\Jagex\<client>. */
export function jagexRoot(): string {
    const programData = process.env.ProgramData ?? (process.platform === "win32" ? "C:\\ProgramData" : undefined);
    if (programData === undefined) {
        throw new CliError("--client only knows where the client keeps plugins on Windows", [
            "use --out <dir> and point it at the client's dev_plugins folder instead",
        ]);
    }
    return path.join(programData, "Jagex");
}

/**
 * The dev_plugins folders of every client that is installed. Dev builds always copy here,
 * so a missing client (or a non-Windows machine) is skipped rather than reported.
 */
export function installedClientDevPluginsDirs(): string[] {
    let root: string;
    try {
        root = jagexRoot();
    } catch {
        return [];
    }
    return Object.values(CLIENT_FOLDERS)
        .map((folder) => path.join(root, folder))
        .filter((clientDir) => fs.existsSync(clientDir))
        .map((clientDir) => path.join(clientDir, "dev_plugins"));
}

/** The dev_plugins folders the chosen clients load from. Each client folder must already exist. */
export function clientDevPluginsDirs(choice: ClientChoice): string[] {
    const keys: ("beta" | "live")[] = choice === "all" ? ["beta", "live"] : [choice];
    const root = jagexRoot();
    return keys.map((key) => {
        const clientDir = path.join(root, CLIENT_FOLDERS[key]);
        if (!fs.existsSync(clientDir)) {
            throw new CliError(`the ${CLIENT_FOLDERS[key]} client is not installed at ${clientDir}`, [
                "install it with the Jagex launcher, pick another client, or copy somewhere else with --out <dir>",
                choice === "all" ? "--client beta or --client live targets just the one you have" : "",
            ]);
        }
        return path.join(clientDir, "dev_plugins");
    });
}
