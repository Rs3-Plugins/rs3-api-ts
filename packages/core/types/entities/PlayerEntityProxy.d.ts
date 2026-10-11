/** @noSelfInFile */

interface PlayerEntityProxy {
    readonly displayName: string;
    readonly coordGrid: CoordGrid;
    readonly coordFine: CoordFine;
    readonly uid: number;
    readonly currentAnimation: number;
    readonly isHidden: boolean;
}
