/** @noSelfInFile */

interface FontConfigProxy extends ConfigTypeProxy {
    readonly baseline: number;
    readonly maxAscent: number;
    readonly maxDescent: number;
    readonly upperCaseAscent: number;
    readonly lowerCaseAscent: number;
    GetStringWidth(text: string): number;
    GetStringWidthMultiline(text: string, width: number): number;
    GetStringLineCount(text: string, width: number): number;
    GetStringHeightAndLineCount(text: string, width: number): LuaMultiReturn<[number, number]>;
    SplitString(text: string, width: number): string[];
    GetSplitStringLine(text: string, width: number, line: number): string;
}
