/** @noSelfInFile */

interface ParamHolder {
    readonly paramCount: number;
    readonly params: unknown;
    HasParam(paramId: number): boolean;
    GetParamValue(paramId: number): number | string | undefined;
}
