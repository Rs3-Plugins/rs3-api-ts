/** @noSelfInFile */

type AssetID<K extends string> = number & { readonly __asset: K };
