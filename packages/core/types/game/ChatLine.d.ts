/** @noSelfInFile */

interface ChatLine {
    readonly text: string;
    readonly name: string;
    readonly type: ChatType;
    readonly timestamp: number;
    readonly senderNameFiltered: string;
    readonly senderNameSimple: string;
    readonly senderNameUnfiltered: string;
}
