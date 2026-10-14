/** @noSelfInFile */

declare namespace prettyui {
    type SimpleButtonAction = (this: void, button: SimpleButton, active: boolean) => void;

    interface SimpleButtonOptions extends PositionOptions {
        toggleable?: boolean;
        disabled?: boolean;
        active?: boolean;
        colour?: Colour;
        disabledColour?: Colour;
        hoverCursor?: CursorValue;
        width?: number;
        height?: number;
        size?: number;
        iconSize?: number;
        iconWidth?: number;
        iconHeight?: number;
        shadowed?: boolean;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.SimpleButton.new */
    class SimpleButton {
        constructor(parent: Component, content: string | number, action?: SimpleButtonAction, options?: SimpleButtonOptions);
        readonly root: Layer;
        readonly interfaceID: number;
        content: globalThis.Text | globalThis.Sprite | Rectangle;
        readonly active: boolean;
        readonly disabled: boolean;
        SetDisabled(disabled: boolean): void;
        SetActive(active: boolean): void;
        SetHoverCursor(cursor: CursorValue | undefined): void;
    }
    interface SimpleButton extends HasTooltip, Destroyable {}
    namespace SimpleButton {
        function getSize(content: string | number, options?: SimpleButtonOptions): Size;
    }

    type FancyButtonVariant = "neutral" | "positive" | "negative";
    type FancyButtonAction = (this: void, button: FancyButton) => void;

    interface FancyButtonOptions extends PositionOptions {
        variant?: FancyButtonVariant;
        width?: number;
        disabled?: boolean;
        colour?: Colour;
        disabledColour?: Colour;
        hoverCursor?: CursorValue;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.FancyButton.new */
    class FancyButton {
        constructor(parent: Component, text: string, action?: FancyButtonAction, options?: FancyButtonOptions);
        readonly root: Layer;
        readonly interfaceID: number;
        readonly label: globalThis.Text;
        readonly variant: FancyButtonVariant;
        readonly disabled: boolean;
        SetDisabled(disabled: boolean): void;
        SetVariant(variant: FancyButtonVariant): void;
        SetText(text: string): void;
        SetHoverCursor(cursor: CursorValue | undefined): void;
    }
    interface FancyButton extends HasTooltip, Destroyable {}
    namespace FancyButton {
        function getSize(text: string | undefined, options?: FancyButtonOptions): Size;
    }

    type SpriteButtonName =
        | "MENU" | "FILTER" | "INFO" | "SETTINGS" | "PAUSE" | "STOP" | "PLAY" | "UNDO" | "REFRESH"
        | "BACK" | "PIN" | "ERASER" | "CROSS" | "AUDIO" | "PENCIL" | "EYE" | "HIDE" | "STAR"
        | "LIST_LAYOUT" | "GRID_LAYOUT" | "CAPE" | "SHIELD" | "BODY" | "AMULET" | "LEGS"
        | "BOOT" | "OUTFIT" | "HAND" | "KEEPSAKE" | "PYRAMID" | "SPECIAL" | "PLUS" | "GRAPH"
        | "IMPORT" | "EXPORT" | "LADDER_UP" | "LADDER_DOWN" | "ARROW_UP" | "ARROW_RIGHT"
        | "ARROW_LEFT" | "ARROW_DOWN" | "SEARCH" | "CHAT" | "DIAMOND" | "SWAP" | "BROADCAST"
        | "LOCK" | "TRASH"
        | (string & {});

    type SpriteButtonAction = (this: void, button: SpriteButton, enabled: boolean) => void;

    interface SpriteButtonOptions extends PositionOptions {
        toggleable?: boolean;
        disabled?: boolean;
        hoverCursor?: CursorValue;
        width?: number;
        height?: number;
        size?: number;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.SpriteButton.new */
    class SpriteButton {
        constructor(parent: Component, spriteName: SpriteButtonName, action?: SpriteButtonAction, options?: SpriteButtonOptions);
        readonly root: globalThis.Sprite;
        readonly interfaceID: number;
        readonly spriteName: string;
        readonly disabled: boolean;
        SetDisabled(disabled: boolean): void;
        SetSprite(spriteName: SpriteButtonName): void;
        SetHoverCursor(cursor: CursorValue | undefined): void;
    }
    interface SpriteButton extends HasTooltip, Destroyable {}

    type RibbonButtonAction = (this: void, button: RibbonButton) => void;

    interface RibbonButtonOptions extends PositionOptions {
        disabled?: boolean;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.RibbonButton.new */
    class RibbonButton {
        constructor(parent: Component, spriteID: number, action?: RibbonButtonAction, options?: RibbonButtonOptions);
        readonly root: Layer;
        readonly icon: globalThis.Sprite;
        readonly interfaceID: number;
        readonly active: boolean;
        readonly disabled: boolean;
        SetIcon(spriteID: number): void;
        SetActive(active: boolean): void;
    }
    interface RibbonButton extends HasTooltip, Destroyable {}
}
