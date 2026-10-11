import { stdout } from "node:process";

const enabled = stdout.isTTY === true && process.env.NO_COLOR === undefined;

function paint(code: number): (text: string) => string {
    return (text) => (enabled ? `\x1b[${code}m${text}\x1b[0m` : text);
}

export const red = paint(31);
export const yellow = paint(33);
export const green = paint(32);
export const dim = paint(2);
export const bold = paint(1);
