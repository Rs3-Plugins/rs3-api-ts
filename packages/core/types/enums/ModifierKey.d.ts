/** @noSelfInFile */

declare enum ModifierKey {
    SHIFT = 1,
    ALT = 2,
    CONTROL = 4,
    ANY = 7,
    META = 8,
    ANY_INC_META = 15,
}
declare namespace ModifierKey {
    function FromID(id: number): ModifierKey;
}
