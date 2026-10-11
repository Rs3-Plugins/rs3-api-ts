/** @noSelfInFile */

declare enum AchievementDescriptionType {
    DEFAULT = 0,
    IRONMAN = 1,
    GROUP_IRONMAN_SIZE_2 = 2,
    GROUP_IRONMAN_SIZE_3 = 3,
    GROUP_IRONMAN_SIZE_4 = 4,
    GROUP_IRONMAN_SIZE_5 = 5,
}
declare namespace AchievementDescriptionType {
    function FromID(id: number): AchievementDescriptionType;
}
