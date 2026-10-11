/** @noSelfInFile */

interface MapElementTypeProxy extends ConfigTypeProxy, ParamHolder {
    readonly text: string;
    readonly subjectText: string;
    readonly spriteID: number;
    readonly spriteMouseOverID: number;
    readonly flashSpriteID: number;
    readonly category: number;
    readonly listable: boolean;
    readonly isMulitiMapElement: boolean;
    readonly showOnMiniMap: boolean;
    readonly showOnWorldMap: boolean;
    readonly minimapIconScale: number;
    readonly alignHorizontal: MapElementHorizontalAlign;
    readonly alignVertical: MapElementVerticalAlign;
    readonly textSize: MapElementTextSize;
    readonly textColour: number;
    readonly textRGBA: number;
    readonly textMouseOverColour: number;
    readonly textMouseOverRGBA: number;
    readonly textOffsetX: number;
    readonly textOffsetZ: number;
    readonly textBGFill: boolean;
    readonly textBGFillRGBA: number;
    readonly textBGOutline: boolean;
    readonly textBGOutlineRGBA: number;
}
