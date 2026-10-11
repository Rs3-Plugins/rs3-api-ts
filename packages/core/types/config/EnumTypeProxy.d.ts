/** @noSelfInFile */

interface EnumTypeProxy extends ConfigTypeProxy {
    readonly inputValueType: ValueType;
    readonly outputValueType: ValueType;
    readonly valueCount: number;
    readonly values: unknown;
    GetInputValues(): unknown[];
    GetOutputValue(input: number): number | string | undefined;
    HasOutputValue(input: number): boolean;
}
