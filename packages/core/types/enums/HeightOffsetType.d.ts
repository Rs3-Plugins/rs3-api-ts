/** @noSelfInFile */

declare enum HeightOffsetType {
    NONE = 0,
    GROUND_DECOR = 1,
    LOCATION = 2,
}
declare namespace HeightOffsetType {
    function FromID(id: number): HeightOffsetType;
}
