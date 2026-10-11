/** @noSelfInFile */

declare enum ObjStackType {
    SOMETIMES = 0,
    ALWAYS = 1,
    NEVER = 2,
}
declare namespace ObjStackType {
    function FromID(id: number): ObjStackType;
}
