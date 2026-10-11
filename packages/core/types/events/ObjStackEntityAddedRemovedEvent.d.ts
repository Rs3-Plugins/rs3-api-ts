/** @noSelfInFile */

interface ObjStackEntityAddedRemovedEvent {
    readonly objStackEntity: ObjStackEntityProxy;
    readonly objType: ObjTypeProxy | undefined;
    readonly count: number;
    readonly coordGrid: CoordGrid;
    readonly isOwner: boolean;
}
