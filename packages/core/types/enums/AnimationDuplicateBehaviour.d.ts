/** @noSelfInFile */

declare enum AnimationDuplicateBehaviour {
    CONTINUE = 0,
    RESET = 1,
    LOOP_RESET = 2,
}
declare namespace AnimationDuplicateBehaviour {
    function FromID(id: number): AnimationDuplicateBehaviour;
}
