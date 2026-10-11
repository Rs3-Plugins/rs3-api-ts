/** @noSelfInFile */

declare enum BoxCornerType {
    LEFT_TOP_NEAR = 0,
    RIGHT_TOP_NEAR = 1,
    LEFT_BOTTOM_NEAR = 2,
    RIGHT_BOTTOM_NEAR = 3,
    LEFT_TOP_FAR = 4,
    RIGHT_TOP_FAR = 5,
    LEFT_BOTTOM_FAR = 6,
    RIGHT_BOTTOM_FAR = 7,
}
declare namespace BoxCornerType {
    function FromID(id: number): BoxCornerType;
}
