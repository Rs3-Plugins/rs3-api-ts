/** @noSelfInFile */

declare namespace prettyui {
    type Colour = number;

    type CursorValue = number | { readonly id: number };

    type SpriteSource = PluginResource | number;

    interface TooltipOptions {
        text?: string;
        width?: number;
        height?: number;
        maxWidth?: number;
        placement?: "left" | "right" | "above" | "below";
        x?: number;
        y?: number;
        boundsMargin?: number;
        constrainToParent?: boolean;
        parent?: Component;
    }

    type TooltipValue = string | number | TooltipOptions;

    interface PositionOptions {
        x?: number;
        y?: number;
        xAnchor?: number;
        yAnchor?: number;
    }

    interface SizeOptions {
        width?: number;
        height?: number;
        widthAnchor?: number;
        heightAnchor?: number;
    }

    interface FlowOptions {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        widthAnchor?: number;
        inline?: boolean;
        absolute?: boolean;
        marginTop?: number;
        marginBottom?: number;
        offsetY?: number;
        columnGap?: number;
        size?: number;
        rowBackground?: boolean;
        rowBackgroundGroup?: string | number;
    }

    interface LayoutOptions {
        startY?: number;
        padding?: number;
        paddingLeft?: number;
        paddingRight?: number;
        paddingBottom?: number;
        columnGap?: number;
        rowGap?: number;
    }

    interface ScrollOptions {
        contentHeight?: number;
        scrollable?: boolean;
        scrollStep?: number;
    }

    interface RowBackgroundOptions {
        rowBackgroundColours?: Colour[];
        rowBackgroundColors?: Colour[];
        rowBackgroundEdgeToEdge?: boolean;
    }

    interface HostOptions extends ScrollOptions {
        layout?: LayoutOptions;
        textLayout?: LayoutOptions;
        tooltip?: TooltipValue;
    }

    type FlowOwner = ScrollHost;

    type Size = LuaMultiReturn<[number, number]>;

    interface HasTooltip {
        SetTooltip(value: TooltipValue | undefined): boolean;
        tooltip: Tooltip | undefined;
    }

    interface Destroyable {
        Destroy(): void;
    }
}
