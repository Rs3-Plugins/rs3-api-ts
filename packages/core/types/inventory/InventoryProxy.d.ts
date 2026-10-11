/** @noSelfInFile */

interface InventoryProxy {
    readonly isValid: boolean;
    readonly slotCount: number;
    readonly usedSlotCount: number;
    readonly freeSlotCount: number;
    GetSlot(index: number): InventorySlot | undefined;
    GetSlots(): InventorySlot[];
    GetTotal(objId: number): number;
    GetCategoryTotal(categoryId: number): number;
}
