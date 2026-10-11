/** @noSelfInFile */

interface GrandExchangeOffer {
    readonly stage: GrandExchangeOfferStage;
    readonly type: GrandExchangeOfferType;
    readonly item: number;
    readonly price: number;
    readonly itemCount: number;
    readonly soldCount: number;
    readonly goldFromSale: number;
}
