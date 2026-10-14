/** @noSelfInFile */

declare namespace prettyui {
    interface TabSpecOptions extends RowBackgroundOptions {
        kind?: "text" | "icon";
        type?: "text" | "icon";
        flavour?: "text" | "icon";
        flavor?: "text" | "icon";
        text?: string;
        label?: string;
        value?: unknown;
        icon?: number;
        spriteID?: number;
        disabled?: boolean;
        width?: number;
        iconSize?: number;
        colour?: Colour;
        shadowed?: boolean;
        tooltip?: TooltipValue;
        hoverCursor?: CursorValue;
        scrollable?: boolean;
        contentHeight?: number;
    }

    type TabSpec = string | number | TabSpecOptions;

    interface TabsOptions extends PositionOptions, SizeOptions, ScrollOptions, RowBackgroundOptions {
        width?: number;
        height?: number;
        onChange?: (this: void, tabs: Tabs, index: number, value: unknown, page: TabPage) => void;
        tabGap?: number;
        tabInset?: number;
        iconSize?: number;
        activeIndex?: number;
        contentLayout?: LayoutOptions;
        tooltip?: TooltipValue;
    }

    interface Tab {
        readonly index: number;
        readonly kind: "text" | "icon";
        readonly text: string;
        readonly value: unknown;
        readonly disabled: boolean;
        readonly width: number;
        readonly hit: Layer;
        readonly visual: Layer;
        readonly label: globalThis.Text | undefined;
    }

    interface TabPage extends ContentHost, ScrollHost, RowBackgroundHost {
        readonly root: Layer;
        readonly index: number;
        readonly tabs: Tabs;
        readonly interfaceID: number;
    }

    /** @customConstructor prettyui.Tabs.new */
    class Tabs {
        constructor(parent: Component, values: ReadonlyArray<TabSpec>, options?: TabsOptions);
        readonly root: Layer;
        readonly parent: Component;
        readonly interfaceID: number;
        readonly tabs: Tab[];
        readonly pages: TabPage[];
        readonly activeIndex: number | undefined;
        SetActive(index: number, notify?: boolean): boolean;
        GetActiveIndex(): number | undefined;
        GetTab(index: number): Tab | undefined;
        GetPage(index: number): TabPage | undefined;
        SetTabTooltip(index: number, value: TooltipValue | undefined): boolean;
        SetDisabled(index: number, disabled: boolean): boolean;
        SetScrollable(scrollable: boolean): void;
        BindFlow(owner: FlowOwner): this;
    }
    interface Tabs extends HasTooltip, Destroyable {}
    namespace Tabs {
        function getSize(_tabs: ReadonlyArray<TabSpec> | undefined, options?: TabsOptions): Size;
        function flowOptions(options?: TabsOptions & FlowOptions): TabsOptions & FlowOptions;
    }
}
