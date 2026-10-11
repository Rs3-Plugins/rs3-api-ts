/** @noSelfInFile */

declare namespace ScreenConvert {
    function ScreenToCoordGrid(x: number, y: number): CoordGrid | undefined;
    function CoordGridToScreen(coord: CoordGrid): Vector2 | undefined;
    function ScreenToCoordFine(x: number, y: number): CoordFine | undefined;
    function CoordFineToScreen(coord: CoordFine): Vector2 | undefined;
    function Vector3ToScreen(position: Vector3): Vector2 | undefined;
}
