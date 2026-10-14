/** @noSelfInFile */

declare namespace prettyui {
    interface Tooltip {
        readonly root: Layer | undefined;
        readonly target: Component | undefined;
        readonly width: number;
        readonly height: number;
        readonly options: TooltipOptions;
        Show(): void;
        Hide(): void;
        SetText(text: string): boolean;
        Destroy(): void;
    }

    interface TooltipHoverHandlers {
        followCursor?: boolean;
        onMouseOver?: (this: void, tooltip: Tooltip) => void;
        onMouseLeave?: (this: void, tooltip: Tooltip) => void;
    }

    interface TooltipContext {
        readonly collection: Component;
        readonly parent: Component;
        readonly position: (this: void, target: Component) => LuaMultiReturn<[number, number]>;
        readonly parentContext: TooltipContext | undefined;
        readonly children: TooltipContext[];
        readonly tooltips: Tooltip[];
        readonly active: boolean;
        readonly ownerWindow: Window | undefined;
    }

    interface TooltipOwner {
        [field: string]: unknown;
    }

    namespace Tooltip {
        function attach(target: Component, parent: Component, value: TooltipValue | undefined, hoverHandlers?: TooltipHoverHandlers): Tooltip | undefined;
        function hideContextTooltips(collection: Component): void;
        function moveContextTooltipsToFront(collection: Component): void;
        function getContext(collection: Component): TooltipContext | undefined;
        function registerContext(collection: Component, parent: Component, position: (this: void, target: Component) => LuaMultiReturn<[number, number]>, parentContext?: TooltipContext): TooltipContext;
        function unregisterContext(collection: Component): void;
        function bind(owner: TooltipOwner, target: Component, parent: Component, value: TooltipValue | undefined, field?: string): Tooltip | undefined;
        function set(owner: TooltipOwner, value: TooltipValue | undefined, field?: string): boolean;
        function unbind(owner: TooltipOwner, field?: string): boolean;
    }

    interface AnchorEntity {
        readonly isValid: boolean;
        readonly position: Vector3;
    }

    interface AnchoredTooltipOptions {
        npc?: AnchorEntity;
        loc?: CoordGrid | CoordFine;
        position?: Vector3;
        anchor?: (this: void, tooltip: AnchoredTooltip) => Vector2 | undefined;
        hidden?: boolean;
        heightAboveGround?: number;
        offsetX?: number;
        offsetY?: number;
        padding?: number;
        paddingX?: number;
        paddingY?: number;
        buildContent?: (this: void, tooltip: AnchoredTooltip, content: Layer) => unknown;
        content?: (this: void, tooltip: AnchoredTooltip, content: Layer) => unknown;
        text?: string;
        width?: number;
        height?: number;
        maxWidth?: number;
        contentWidth?: number;
        contentHeight?: number;
        clickthrough?: boolean;
        backgroundColour?: Colour;
        backgroundAlpha?: number;
        font?: number;
        colour?: Colour;
        alignHorizontal?: ui.AlignMode;
        alignVertical?: ui.AlignMode;
        shadowed?: boolean;
    }

    /** @customConstructor prettyui.AnchoredTooltip.new */
    class AnchoredTooltip {
        constructor(parent: Component, options: AnchoredTooltipOptions);
        readonly root: Layer | undefined;
        readonly content: Layer | undefined;
        readonly interfaceID: number;
        readonly visible: boolean;
        readonly width: number;
        readonly height: number;
        readonly text: string;
        readonly contentResult: unknown;
        Update(): boolean;
        SetText(text: string): boolean;
        Show(): boolean;
        Hide(): void;
    }
    interface AnchoredTooltip extends Destroyable {}
    namespace AnchoredTooltip {
        function show(options: AnchoredTooltipOptions & { parent?: Component }): AnchoredTooltip | undefined;
        function forNPC(npc: AnchorEntity, options?: Omit<AnchoredTooltipOptions, "npc"> & { parent?: Component }): AnchoredTooltip | undefined;
        function forLoc(loc: CoordGrid | CoordFine, options?: Omit<AnchoredTooltipOptions, "loc"> & { parent?: Component }): AnchoredTooltip | undefined;
    }
}
