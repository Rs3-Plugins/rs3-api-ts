/** @noSelfInFile */

declare class CoordGrid {
    readonly mapSquareX: number;
    readonly mapSquareZ: number;
    readonly localX: number;
    readonly localZ: number;
    readonly level: number;
    ToCoordFine(): CoordFine;
    ToPacked(): number;
    static FromCoordFine(coord: CoordFine): CoordGrid;
}
