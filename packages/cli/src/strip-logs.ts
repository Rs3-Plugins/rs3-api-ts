import * as ts from "typescript";
import { createNilLiteral, type Plugin } from "typescript-to-lua";

const SILENCED = new Set(["print", "warn"]);

function isSilencedCall(node: ts.Node): boolean {
    if (!ts.isCallExpression(node)) {
        return false;
    }
    const callee = node.expression;
    return ts.isIdentifier(callee) && SILENCED.has(callee.text);
}


function isLogLine(line: string): boolean {
    const opening = /^[ \t]*(?:print|warn)\(/.exec(line);
    if (opening === null) {
        return false;
    }
    let depth = 0;
    for (let i = opening[0].length - 1; i < line.length; i++) {
        const character = line[i];
        if (character === "(") {
            depth = depth + 1;
        } else if (character === ")") {
            depth = depth - 1;
            if (depth === 0) {
                return line.slice(i + 1).trim() === "";
            }
        }
    }
    return false;
}

export function stripLuaLogs(code: string): string {
    const lines = code.split("\n");
    const kept = /\b(?:print|warn)\(/.test(code) ? lines.filter((line) => !isLogLine(line)) : lines;
    return kept.map((line) => line.replace(/function\(([^()]*)\) return nil end/g, "function($1) end")).join("\n");
}

export const stripLogs: Plugin = {
    visitors: {
        [ts.SyntaxKind.ExpressionStatement]: (node, context) => {
            if (isSilencedCall(node.expression)) {
                return [];
            }
            return context.superTransformStatements(node);
        },
        [ts.SyntaxKind.CallExpression]: (node, context) => {
            if (isSilencedCall(node)) {
                return createNilLiteral(node);
            }
            return context.superTransformExpression(node);
        },
    },
};
