/** @noSelfInFile */

declare enum QuestDifficulty {
    NOVICE = 0,
    INTERMEDIATE = 1,
    EXPERIENCED = 2,
    MASTER = 3,
    GRANDMASTER = 4,
    MULTIDIFFICULTY = 5,
}
declare namespace QuestDifficulty {
    function FromID(id: number): QuestDifficulty;
}
