/** @noSelfInFile */

interface ObjStackEntityProxy {
    readonly coordGrid: CoordGrid;
    readonly stackSize: number;
    GetEntry(index: number): ObjStackEntry | undefined;
    HasObj(obj: ObjTypeProxy): boolean;
    HasObjID(objId: number): boolean;
}
