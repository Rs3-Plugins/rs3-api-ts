/** @noSelfInFile */

interface ObjStackEntityChangedEvent {
    readonly objStackEntity: ObjStackEntityProxy;
    readonly objType: ObjTypeProxy | undefined;
    readonly oldCount: number;
    readonly newCount: number;
}
