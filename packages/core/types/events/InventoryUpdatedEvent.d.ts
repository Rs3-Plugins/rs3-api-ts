/** @noSelfInFile */

interface InventoryUpdatedEvent {
    readonly inv: InventoryProxy;
    readonly slotsUpdated: number[];
}
