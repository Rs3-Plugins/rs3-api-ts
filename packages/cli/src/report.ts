import * as path from "node:path";
import type { Problem } from "./checks";
import type { BuildResult } from "./build";
import { CliError } from "./errors";

/** Prints a thrown error the same way a build problem is printed, hint included. */
export function printError(error: unknown): void {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof CliError && error.hint !== undefined) {
        for (const line of error.hint.split("\n")) {
            console.error(line === "" ? "" : `  ${line}`);
        }
    }
}

function location(problem: Problem): string {
    if (problem.file === undefined) {
        return "";
    }
    const file = path.relative(process.cwd(), problem.file);
    return problem.line !== undefined ? `${file}:${problem.line}: ` : `${file}: `;
}

export function printProblems(problems: Problem[]): void {
    const ordered = [...problems].sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
    for (const problem of ordered) {
        const out = problem.level === "error" ? console.error : console.warn;
        out(`${problem.level}: ${location(problem)}${problem.message}`);
        if (problem.hint !== undefined) {
            const lines = Array.isArray(problem.hint) ? problem.hint : problem.hint.split("\n");
            for (const line of lines) {
                out(line === "" ? "" : `  ${line}`);
            }
        }
    }
}

export function printSummary(result: BuildResult): void {
    const errors = result.problems.filter((p) => p.level === "error").length;
    const warnings = result.problems.filter((p) => p.level === "warning").length;
    const name = result.project.manifest?.name ?? "plugin";
    const mode = result.dev ? "dev bundle" : "release";
    for (const note of result.notes) {
        console.log(`note: ${note}`);
    }
    if (result.ok) {
        console.log(`built ${name} (${mode}) -> ${path.relative(process.cwd(), result.outDir) || "."} (${result.files.length} lua file${result.files.length === 1 ? "" : "s"}${warnings > 0 ? `, ${warnings} warning${warnings === 1 ? "" : "s"}` : ""})`);
        if (result.deployedTo !== undefined) {
            console.log(`copied to ${result.deployedTo}`);
        }
    } else {
        console.error(`build failed: ${errors} error${errors === 1 ? "" : "s"}${warnings > 0 ? `, ${warnings} warning${warnings === 1 ? "" : "s"}` : ""}`);
    }
}
