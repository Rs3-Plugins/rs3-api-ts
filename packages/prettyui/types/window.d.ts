/** @noSelfInFile */

declare namespace prettyui {
    interface WindowOptions extends PositionOptions, HostOptions, RowBackgroundOptions {
        title?: string;
        onClose?: (this: void, window: Window) => void;
        destroyOnClose?: boolean;
        width?: number;
        height?: number;
        minWidth?: number;
        minHeight?: number;
        maxWidth?: number;
        maxHeight?: number;
        resizable?: boolean;
    }

    /** @customConstructor prettyui.Window.new */
    class Window {
        constructor(parent: Component, options?: WindowOptions);
        readonly root: Layer;
        readonly parent: Component;
        readonly interfaceID: number;
        title: string | undefined;
        readonly closeButton: globalThis.Sprite;
        readonly titleText: globalThis.Text | undefined;
        minWidth: number;
        minHeight: number;
        maxWidth: number | undefined;
        maxHeight: number | undefined;
        SetSize(width: number, height: number): void;
        SetTitle(title: string | undefined): void;
        Show(): void;
        Close(): void;
    }
    interface Window extends ContentHost, ScrollHost, RowBackgroundHost, HasTooltip, Destroyable {}
}
