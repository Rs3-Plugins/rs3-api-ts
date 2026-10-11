/** @noSelfInFile */

interface ParamTypeProxy extends ConfigTypeProxy {
    readonly valueType: ValueType;
    readonly defaultValue: number | string | undefined;
}
