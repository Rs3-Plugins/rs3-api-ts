/** @noSelfInFile */

interface LocTypeProxy extends ConfigTypeProxy, ParamHolder {
    readonly name: string;
    readonly width: number;
    readonly length: number;
    readonly isActive: boolean;
    readonly isMultiLoc: boolean;
    readonly isExamineOnly: boolean;
    readonly blockWalk: number;
    readonly multiVar: number;
    readonly mapElement: number;
    readonly opNames: string[];
    readonly locShapeTypes: LocShapeType[];
    readonly animations: unknown;
    readonly defaultAnimation: number;
    readonly useRandomAnimationFrame: boolean;
    readonly modelOffset: Vector3;
    readonly modelPostOffset: Vector3;
    readonly modelScale: Vector3;
    readonly groundDecorOffset: number;
    readonly customBounding: unknown;
    readonly hasCustomBounding: boolean;
    readonly fastPicking: boolean;
    readonly quests: unknown;
    GetModelIDs(): number[];
    GetOpCursor(op: number): number;
}
