/** @noSelfInFile */

declare enum PreAnimMove {
    DELAY_MOVE = 0,
    DELAY_ANIMATION = 1,
    MOVE_MERGE = 2,
    ABORT_ANIMATION = 3,
    DEFAULT = 4,
}
declare namespace PreAnimMove {
    function FromID(id: number): PreAnimMove;
}
