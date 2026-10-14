/** @noSelfInFile */

declare namespace prettyui {
    interface SimpleViewOptions extends PositionOptions, SizeOptions, HostOptions {}

    /** @customConstructor prettyui.SimpleView.new */
    class SimpleView {
        constructor(parent: Component, options?: SimpleViewOptions);
        readonly root: Layer;
        readonly parent: Component;
        readonly interfaceID: number;
        readonly width: number;
        readonly height: number;
        SetSize(width: number, height: number, widthAnchor?: number, heightAnchor?: number): void;
        Refresh(): void;
        SetClickthrough(clickthrough: boolean): void;
        RegisterClipTarget(target: TextField): void;
        UnregisterClipTarget(target: TextField): void;
    }
    interface SimpleView extends ContentHost, ScrollHost, HasTooltip, Destroyable {}

    /** @customConstructor prettyui.Scrollbar.new */
    class Scrollbar extends SimpleView {
        constructor(parent: Component, options?: SimpleViewOptions);
    }
}
