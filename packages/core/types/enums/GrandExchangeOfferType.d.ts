/** @noSelfInFile */

declare enum GrandExchangeOfferType {
    BUY = 0,
    SELL = 1,
}
declare namespace GrandExchangeOfferType {
    function FromID(id: number): GrandExchangeOfferType;
}
