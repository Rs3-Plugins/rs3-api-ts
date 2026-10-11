/** @noSelfInFile */

declare enum GrandExchangeOfferStage {
    EMPTY = 0,
    ADDING = 1,
    ADDED = 2,
    VERIFYING = 3,
    ABORTING = 4,
    FINISHED = 5,
}
declare namespace GrandExchangeOfferStage {
    function FromID(id: number): GrandExchangeOfferStage;
}
