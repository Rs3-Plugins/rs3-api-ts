/** @noSelfInFile */

declare enum MiniMenuEntryType {
    NONE = 0,
    INTERFACE = 1,
    OBJ = 2,
    LOC = 3,
    NPC = 4,
    OTHER = 5,
    MINIMENU = 6,
    PLAYER = 7,
    SELF = 8,
    MAP = 9,
    PLUGIN = 10,
}
declare namespace MiniMenuEntryType {
    function FromID(id: number): MiniMenuEntryType;
}
