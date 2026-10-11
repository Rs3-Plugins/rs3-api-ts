/** @noSelfInFile */

interface DBRowTypeProxy extends ConfigTypeProxy {
    readonly columnCount: number;
    readonly ownerDBTable: number;
    GetColumnValueCount(column: number): number;
    GetColumnValueTypes(column: number): ValueType[];
    GetColumnValues(column: number): unknown[];
}
