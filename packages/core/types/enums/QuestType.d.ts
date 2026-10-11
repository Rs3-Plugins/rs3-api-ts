/** @noSelfInFile */

declare enum QuestType {
    NORMAL = 0,
    SEASONAL = 1,
    TUTORIAL = 2,
}
declare namespace QuestType {
    function FromID(id: number): QuestType;
}
