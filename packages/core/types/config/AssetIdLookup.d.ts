/** @noSelfInFile */

/** @noSelf */
interface AssetIdLookup<K extends string> {
    readonly assetTypeID: number;
    FromID(id: number): AssetID<K>;
}
