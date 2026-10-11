/** @noSelfInFile */

declare enum RotationType {
    ZERO = 0,
    NINETY = 1,
    ONEEIGHTY = 2,
    TWOSEVENTY = 3,
}
declare namespace RotationType {
    function FromID(id: number): RotationType;
}
