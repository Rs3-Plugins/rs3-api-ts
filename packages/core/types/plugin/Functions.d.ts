/** @noSelfInFile */

declare function formatStr(format: string, ...args: any[]): string;
declare function clamp(value: number, min: number, max: number): number;
declare function lerp(a: number, b: number, t: number): number;
declare function slerp(a: Quaternion, b: Quaternion, t: number): Quaternion;
declare function random(): number;
declare function log(message: string): void;
declare function warn(message: string): void;
