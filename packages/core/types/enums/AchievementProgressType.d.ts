/** @noSelfInFile */

declare enum AchievementProgressType {
    DEPRECATED = -4,
    GRACE = -3,
    COMPLETE = -2,
    LOCKED = -1,
    READY = 0,
}
declare namespace AchievementProgressType {
    function FromID(id: number): AchievementProgressType;
}
