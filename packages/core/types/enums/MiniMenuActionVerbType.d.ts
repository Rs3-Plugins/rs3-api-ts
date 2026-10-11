/** @noSelfInFile */

declare enum MiniMenuActionVerbType {
    ATTACK = 0,
    EXAMINE = 1,
    OP = 2,
    UNSPECIFIED = 3,
}
declare namespace MiniMenuActionVerbType {
    function FromID(id: number): MiniMenuActionVerbType;
}
