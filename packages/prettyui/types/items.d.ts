/** @noSelfInFile */

declare namespace prettyui {
    interface SpriteOptions extends PositionOptions, SizeOptions {
        size?: number;
        colour?: Colour;
        color?: Colour;
        alpha?: number;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.Sprite.new */
    class Sprite {
        constructor(parent: Component, sprite: SpriteSource, options?: SpriteOptions);
        readonly root: globalThis.Sprite;
        readonly interfaceID: number;
        SetSprite(sprite: SpriteSource): void;
    }
    interface Sprite extends HasTooltip, Destroyable {}
    namespace Sprite {
        function getSize(options?: SpriteOptions): Size;
    }

    interface ItemSlotOptions extends PositionOptions {
        disabled?: boolean;
        tooltip?: TooltipValue;
        quantity?: number;
        quantityMode?: ui.ObjectQuantityDisplayMode;
        itemInset?: number;
        outlineWidth?: number;
        shadowRGBA?: Colour;
        backgroundSpriteID?: number;
        onObjectChange?: (this: void, slot: ItemSlot, object: ObjTypeProxy | undefined) => void;
        clickthrough?: boolean;
    }

    /** @customConstructor prettyui.ItemSlot.new */
    class ItemSlot {
        constructor(parent: Component, object: ObjTypeProxy | undefined, options?: ItemSlotOptions);
        readonly root: Layer;
        readonly background: globalThis.Sprite;
        readonly item: globalThis.Sprite | undefined;
        readonly interfaceID: number;
        readonly object: ObjTypeProxy | undefined;
        readonly quantity: number | undefined;
        readonly disabled: boolean;
        SetObject(object: ObjTypeProxy | undefined, quantity?: number): void;
        SetQuantity(quantity: number | undefined): void;
        SetDisabled(disabled: boolean): void;
        SetTooltip(value: TooltipValue | undefined): boolean;
        readonly tooltip: Tooltip | undefined;
    }
    interface ItemSlot extends Destroyable {}

    interface ItemGridEntryOptions {
        object?: ObjTypeProxy;
        tooltip?: TooltipValue;
        quantity?: number;
    }

    type ItemGridEntry = ObjTypeProxy | ItemGridEntryOptions;

    type ItemGridTooltip =
        | TooltipValue
        | boolean
        | ((this: void, object: ObjTypeProxy, index: number, row: number, column: number) => TooltipValue | undefined);

    interface ItemGridOptions extends PositionOptions {
        columns?: number;
        rows?: number;
        slotGap?: number;
        tooltip?: ItemGridTooltip;
        dragDrop?: boolean;
        onDrop?: (this: void, grid: ItemGrid, sourceIndex: number, destinationIndex: number, sourceObject: ObjTypeProxy | undefined, destinationObject: ObjTypeProxy | undefined) => void;
        itemInset?: number;
        outlineWidth?: number;
        shadowRGBA?: Colour;
        quantityMode?: ui.ObjectQuantityDisplayMode;
    }

    /** @customConstructor prettyui.ItemGrid.new */
    class ItemGrid {
        constructor(parent: Component, objects?: ReadonlyArray<ItemGridEntry | undefined>, options?: ItemGridOptions);
        readonly root: Layer;
        readonly interfaceID: number;
        readonly columns: number;
        readonly rows: number;
        readonly capacity: number;
        readonly slots: ItemSlot[];
        readonly dragDrop: boolean;
        GetSlot(index: number): ItemSlot | undefined;
        SetObject(index: number, object?: ObjTypeProxy, tooltip?: TooltipValue, quantity?: number): boolean;
        SetObjectAt(column: number, row: number, object?: ObjTypeProxy, tooltip?: TooltipValue, quantity?: number): boolean;
        SetTooltip(value: ItemGridTooltip | undefined): boolean;
        MoveObject(sourceIndex: number, destinationIndex: number, notify?: boolean): boolean;
        SetDragDropEnabled(enabled: boolean): void;
        SetObjects(objects: ReadonlyArray<ItemGridEntry | undefined> | undefined): void;
    }
    interface ItemGrid extends Destroyable {}
    namespace ItemGrid {
        function getSize(options?: ItemGridOptions): Size;
    }

    interface SpinnerOptions extends PositionOptions {
        degreesPerLogicUpdate?: number;
        rotation?: number;
        width?: number;
        height?: number;
        size?: number;
        autoPlay?: boolean;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.Spinner.new */
    class Spinner {
        constructor(parent: Component, options?: SpinnerOptions);
        readonly root: Layer;
        readonly interfaceID: number;
        readonly running: boolean;
        readonly rotation: number;
        SetRotation(degrees: number): void;
        SetDegreesPerLogicUpdate(degrees: number): void;
        Start(): void;
        Stop(): void;
        Reset(): void;
    }
    interface Spinner extends HasTooltip, Destroyable {}

    /** @customConstructor prettyui.BigSpinner.new */
    class BigSpinner extends Spinner {
        constructor(parent: Component, options?: SpinnerOptions);
    }
}
