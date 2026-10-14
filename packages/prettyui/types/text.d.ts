/** @noSelfInFile */

declare namespace prettyui {
    interface TextOptions extends PositionOptions, SizeOptions {
        text?: string;
        font?: number;
        colour?: Colour;
        shadowed?: boolean;
        alignHorizontal?: ui.AlignMode;
        alignVertical?: ui.AlignMode;
        maxLines?: number;
        lineSpacing?: number;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.Text.new */
    class Text {
        constructor(parent: Component, options?: TextOptions);
    }
    interface Text extends globalThis.Text {}
    namespace Text {
        function title(parent: Component, options?: TextOptions): globalThis.Text;
        function append(owner: FlowOwner, value: TextEntry, isTitle: boolean): globalThis.Text;
    }

    interface DividerOptions extends PositionOptions {
        width?: number;
        widthAnchor?: number;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.Divider.new */
    class Divider {
        constructor(parent: Component, options?: DividerOptions);
        readonly root: globalThis.Sprite;
        readonly interfaceID: number;
    }
    interface Divider extends HasTooltip, Destroyable {}
    namespace Divider {
        function flowOptions(options?: DividerOptions & FlowOptions): DividerOptions & FlowOptions;
    }
}
