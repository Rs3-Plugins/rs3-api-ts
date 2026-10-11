/** @noSelfInFile */

interface ObjTypeProxy extends ConfigTypeProxy, ParamHolder {
    readonly isValid: boolean;
    readonly name: string;
    readonly cost: number | undefined;
    readonly isMembers: boolean;
    readonly isStockmarket: boolean;
    readonly isTradeable: boolean;
    readonly stackType: ObjStackType;
    readonly stackCountAltObjs: unknown;
    readonly stockmarketBuyLimit: number;
    readonly category: number;
    readonly teamID: number;
    readonly quests: unknown;
    readonly groundOpNames: string[];
    readonly interfaceOpNames: string[];
    GetGroundOpCursor(op: number): number;
    GetInterfaceOpCursor(op: number): number;
}
