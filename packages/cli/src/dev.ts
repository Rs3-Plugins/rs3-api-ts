import * as fs from "node:fs";
import { build } from "./build";
import { loadProject } from "./project";
import { printError, printProblems, printSummary } from "./report";

export interface DevOptions {
    cwd: string;
    deployTo?: string[];
}

/** Rebuilds the dev bundle whenever a source file or plugin.json changes. Runs until interrupted. */
export function dev(options: DevOptions): void {
    const project = loadProject(options.cwd);
    let pending: NodeJS.Timeout | undefined;
    let building = false;
    let queued = false;

    const run = () => {
        if (building) {
            queued = true;
            return;
        }
        building = true;
        try {
            const result = build({ cwd: options.cwd, dev: true, deployTo: options.deployTo });
            printProblems(result.problems);
            printSummary(result);
        } catch (error) {
            printError(error);
        } finally {
            building = false;
        }
        if (queued) {
            queued = false;
            schedule();
        }
    };

    const schedule = () => {
        if (pending !== undefined) {
            clearTimeout(pending);
        }
        pending = setTimeout(run, 150);
    };

    run();
    console.log(`watching ${project.srcDir} for changes (ctrl+c to stop)`);

    fs.watch(project.srcDir, { recursive: true }, schedule);
    if (fs.existsSync(project.manifestPath)) {
        fs.watch(project.manifestPath, schedule);
    }
}
