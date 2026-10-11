/** @noSelfInFile */

declare enum AchievementHiddenType {
    NEVER = 0,
    IF_LOCKED = 1,
    UNTIL_COMPLETE = 2,
}
declare namespace AchievementHiddenType {
    function FromID(id: number): AchievementHiddenType;
}
