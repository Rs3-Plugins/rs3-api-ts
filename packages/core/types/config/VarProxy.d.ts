/** @noSelfInFile */

interface VarProxy extends ConfigTypeProxy {
    readonly value: number | string;
    readonly isVarBit: boolean;
    readonly varBitMask: number;
    readonly baseVar: VarProxy | undefined;
}
