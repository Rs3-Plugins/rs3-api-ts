/** @noSelfInFile */

interface StyleSheetRegistry {
    Contains(name: string): boolean;
    Find(name: string): unknown;
}
