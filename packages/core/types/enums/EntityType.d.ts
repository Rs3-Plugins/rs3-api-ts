/** @noSelfInFile */

declare enum EntityType {
    UNKNOWN = -1,
    LOCATION = 0,
    NPC = 1,
    PLAYER = 2,
    OBJSTACK = 3,
    COMBINED_LOCATION_SECTION = 12,
    NONE = 127,
}
declare namespace EntityType {
    function FromID(id: number): EntityType;
}
