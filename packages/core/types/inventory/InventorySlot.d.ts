/** @noSelfInFile */

interface InventorySlot {
    readonly obj: ObjTypeProxy | undefined;
    readonly count: number;
    readonly stockCount: number | undefined;
}
