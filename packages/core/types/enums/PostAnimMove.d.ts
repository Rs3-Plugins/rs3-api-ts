/** @noSelfInFile */

declare enum PostAnimMove {
    DELAY_MOVE = 0,
    ABORT_ANIMATION = 1,
    MOVE_MERGE = 2,
    DEFAULT = 3,
}
declare namespace PostAnimMove {
    function FromID(id: number): PostAnimMove;
}
