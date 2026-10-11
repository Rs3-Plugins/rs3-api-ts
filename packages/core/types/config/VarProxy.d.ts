/** @noSelfInFile */

interface VarProxy {
    readonly value: number | string;
    readonly isVarBit: boolean;
    readonly varBitMask: number;
    readonly baseVar: number;
}
