import * as readline from "node:readline";
import { stdin, stdout } from "node:process";

/** Re-asks until the validator is happy. */
export async function text(question: string, fallback: string | undefined, validate: (value: string) => string | undefined): Promise<string> {
    for (;;) {
        const raw = (await ask(fallback !== undefined ? `${question} (${fallback}): ` : `${question}: `)).trim();
        const value = raw === "" && fallback !== undefined ? fallback : raw;
        const error = validate(value);
        if (error === undefined) {
            return value;
        }
        stdout.write(`  ${error}\n`);
    }
}

export async function confirm(question: string, fallback: boolean): Promise<boolean> {
    for (;;) {
        const raw = (await ask(`${question} [${fallback ? "Y/n" : "y/N"}]: `)).trim().toLowerCase();
        if (raw === "") {
            return fallback;
        }
        if (raw === "y" || raw === "yes") {
            return true;
        }
        if (raw === "n" || raw === "no") {
            return false;
        }
        stdout.write("  answer y or n\n");
    }
}

export interface SelectItem {
    label: string;
    hint?: string;
}

/** Up and down move, space toggles, `a` toggles all, enter confirms. One boolean per item. */
export function multiSelect(question: string, items: SelectItem[], preselected: boolean[] = []): Promise<boolean[]> {
    if (items.length === 0) {
        return Promise.resolve([]);
    }
    return new Promise((resolve) => {
        const selected = items.map((_, i) => preselected[i] === true);
        let cursor = 0;
        let drawn = false;

        const frame = () => {
            const lines = [`${question}  (up/down move, space toggles, a toggles all, enter confirms)`];
            items.forEach((item, i) => {
                const pointer = i === cursor ? ">" : " ";
                const box = selected[i] ? "[x]" : "[ ]";
                const hint = item.hint !== undefined ? `  ${dim(item.hint)}` : "";
                lines.push(`${pointer} ${box} ${item.label}${hint}`);
            });
            return lines;
        };

        const draw = () => {
            if (drawn) {
                stdout.write(`\x1b[${items.length + 1}A\x1b[J`);
            }
            stdout.write(`${frame().join("\n")}\n`);
            drawn = true;
        };

        const finish = () => {
            stdin.removeListener("keypress", onKeypress);
            if (stdin.isTTY) {
                stdin.setRawMode(false);
            }
            stdin.pause();
            stdout.write("\x1b[?25h");
            const chosen = items.filter((_, i) => selected[i]).map((item) => item.label);
            stdout.write(`${question}: ${chosen.length > 0 ? chosen.join(", ") : "none"}\n`);
            resolve(selected);
        };

        const onKeypress = (_str: string | undefined, key: readline.Key) => {
            if (key.ctrl === true && key.name === "c") {
                stdout.write("\x1b[?25h\n");
                process.exit(130);
            }
            switch (key.name) {
                case "up":
                case "k":
                    cursor = (cursor - 1 + items.length) % items.length;
                    break;
                case "down":
                case "j":
                    cursor = (cursor + 1) % items.length;
                    break;
                case "space":
                    selected[cursor] = !selected[cursor];
                    break;
                case "a":
                    {
                        const all = selected.every(Boolean);
                        selected.fill(!all);
                    }
                    break;
                case "return":
                case "enter":
                    // wipe the list so only the summary line is left behind
                    stdout.write(`\x1b[${items.length + 1}A\x1b[J`);
                    finish();
                    return;
                default:
                    return;
            }
            draw();
        };

        readline.emitKeypressEvents(stdin);
        if (stdin.isTTY) {
            stdin.setRawMode(true);
        }
        stdin.resume();
        stdout.write("\x1b[?25l");
        stdin.on("keypress", onKeypress);
        draw();
    });
}

function ask(prompt: string): Promise<string> {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

function dim(text: string): string {
    return stdout.isTTY ? `\x1b[2m${text}\x1b[22m` : text;
}
