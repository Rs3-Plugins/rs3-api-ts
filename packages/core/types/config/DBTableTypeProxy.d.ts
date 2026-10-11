/** @noSelfInFile */

interface DBTableTypeProxy extends ConfigTypeProxy {
    readonly columnCount: number;
    GetColumnValueCount(column: number): number;
    GetColumnValueTypes(column: number): ValueType[];
    GetColumnDefaultValues(column: number): unknown[];
    GetColumnHasDefaultValues(column: number): boolean;
}
