/** @noSelfInFile */

declare namespace prettyui {
    interface DialogAction {
        label?: string;
        variant?: FancyButtonVariant;
        disabled?: boolean;
        tooltip?: TooltipValue;
        onClick?: (this: void) => boolean | void;
    }

    interface DialogOptions {
        title?: string;
        width?: number;
        height?: number;
        modal?: boolean;
        content?: (this: void, window: Window) => void;
        actions?: ReadonlyArray<DialogAction>;
        onDismiss?: (this: void) => void;
    }

    /** @customConstructor prettyui.Dialog.new */
    class Dialog {
        constructor(parent: Component, options?: DialogOptions);
        readonly parent: Component;
        readonly window: Window;
        readonly closed: boolean;
        readonly options: DialogOptions;
    }
    interface Dialog extends Destroyable {}
    namespace Dialog {
        function depth(parent: Component): number;
        function dismissAll(parent: Component | undefined): void;
        function Shutdown(): void;
    }

    interface ConfirmOptions {
        title?: string;
        body?: string;
        cancelLabel?: string;
        confirmLabel?: string;
        confirmVariant?: FancyButtonVariant;
        width?: number;
        height?: number;
        modal?: boolean;
        onConfirm?: (this: void) => boolean | void;
        onCancel?: (this: void) => boolean | void;
    }

    /** @customConstructor prettyui.Confirm.new */
    class Confirm {
        constructor(parent: Component, options?: ConfirmOptions);
    }
    interface Confirm extends Dialog {}

    interface AchievementPopupOptions extends PositionOptions {
        title?: string;
        text?: string;
        item?: ObjTypeProxy;
        quantity?: number;
        quantityMode?: ui.ObjectQuantityDisplayMode;
        itemInset?: number;
        outlineWidth?: number;
        shadowRGBA?: Colour;
        width?: number;
        height?: number;
        titleColour?: Colour;
        textColour?: Colour;
        shadowed?: boolean;
        sound?: boolean;
        soundID?: number;
        onComplete?: (this: void, popup: AchievementPopup) => void;
    }

    /** @customConstructor prettyui.AchievementPopup.new */
    class AchievementPopup {
        constructor(parent: Component, options?: AchievementPopupOptions);
        readonly root: Layer | undefined;
        readonly interfaceID: number;
        readonly itemSlot: ItemSlot | undefined;
    }
    interface AchievementPopup extends Destroyable {}
    namespace AchievementPopup {
        function show(options?: AchievementPopupOptions & { parent?: Component }): AchievementPopup | undefined;
    }
}
