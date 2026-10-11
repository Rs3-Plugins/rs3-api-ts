/** @noSelfInFile */

declare class CoordFine {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    ToCoordGrid(): CoordGrid;
    static FromCoordGrid(coord: CoordGrid): CoordFine;
}
