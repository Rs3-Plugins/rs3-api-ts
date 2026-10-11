/** @noSelfInFile */

interface NPCEntityProxy {
    readonly displayName: string;
    readonly coordGrid: CoordGrid;
    readonly coordFine: CoordFine;
    readonly uid: number;
    readonly configID: number;
    readonly config: NPCTypeProxy;
    readonly currentAnimation: number;
    readonly isHidden: boolean;
    readonly facing: number;
    readonly facingTarget: unknown;
    readonly route: CoordGrid[];
    readonly routeEnd: CoordGrid | undefined;
}
