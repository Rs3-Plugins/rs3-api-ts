/** @noSelfInFile */

interface InventoryAddedRemovedEvent {
    readonly inv: InventoryProxy;
    readonly slot: InventorySlot | undefined;
}
