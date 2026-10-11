/** @noSelfInFile */

declare enum MapElementTextSize {
    SMALL = 0,
    MEDIUM = 1,
    LARGE = 2,
}
declare namespace MapElementTextSize {
    function FromID(id: number): MapElementTextSize;
}
