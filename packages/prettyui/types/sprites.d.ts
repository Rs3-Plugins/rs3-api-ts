/** @noSelfInFile */

declare namespace prettyui {
    interface FrameSprites {
        readonly topLeft: number;
        readonly top: number;
        readonly topRight: number;
        readonly left: number;
        readonly centre: number;
        readonly right: number;
        readonly bottomLeft: number;
        readonly bottom: number;
        readonly bottomRight: number;
    }

    interface ThreePartSprites {
        readonly left: number;
        readonly middle: number;
        readonly right: number;
    }

    interface ButtonStateSprites {
        readonly normal: number;
        readonly hovered: number;
        readonly pressed: number;
        readonly disabled: number;
    }

    interface SpriteButtonSet {
        readonly neutral: number;
        readonly active: number;
        readonly disabled?: number;
        readonly disabledHovered?: number;
    }

    interface SpriteTable {
        readonly WINDOW_BACKGROUND: number;
        readonly CLOSE: number;
        readonly CLOSE_ACTIVE: number;
        readonly TITLEBAR_RIGHT: number;
        readonly TITLEBAR_LEFT: number;
        readonly TITLEBAR_CENTRE: number;
        readonly TITLEBAR_CENTRE_RIGHT: number;
        readonly TITLEBAR_CENTRE_LEFT: number;
        readonly BORDER_LEFT: number;
        readonly BORDER_BOTTOM: number;
        readonly BORDER_CORNER: number;
        readonly FEEDBACK_POSITION_FRAME: { readonly topLeft: number; readonly top: number; readonly left: number; readonly bottomLeft: number; readonly bottom: number };
        readonly FEEDBACK_FINAL_FRAME: { readonly topLeft: number; readonly top: number; readonly left: number; readonly bottomLeft: number; readonly bottom: number };
        readonly SCROLL_ARROW_UP: number;
        readonly SCROLL_ARROW_DOWN: number;
        readonly SCROLL_TRACK_TOP: number;
        readonly SCROLL_TRACK_CENTRE: number;
        readonly SCROLL_TRACK_BOTTOM: number;
        readonly SCROLL_THUMB_TOP: number;
        readonly SCROLL_THUMB_CENTRE: number;
        readonly SCROLL_THUMB_BOTTOM: number;
        readonly BIG_SPINNER_BACKDROP: number;
        readonly BIG_SPINNER_ROTATING: number;
        readonly SLIDER: {
            readonly backingEnd: number;
            readonly backingTile: number;
            readonly barEnd: number;
            readonly barTile: number;
            readonly thumb: ButtonStateSprites;
            readonly decrease: ButtonStateSprites;
            readonly increase: ButtonStateSprites;
        };
        readonly RIBBON_BUTTON_DISABLED: number;
        readonly RIBBON_BUTTON_NEUTRAL: number;
        readonly RIBBON_BUTTON_HOVERED: number;
        readonly RIBBON_BUTTON_ACTIVE: number;
        readonly CONTENT_FRAME: FrameSprites;
        readonly HUD_WINDOW: {
            readonly cornerTop: number;
            readonly cornerBottom: number;
            readonly top: number;
            readonly bottom: number;
            readonly side: number;
            readonly content: number;
        };
        readonly ANCHORED_TOOLTIP: {
            readonly border: { readonly topLeft: number; readonly top: number; readonly side: number; readonly bottomLeft: number; readonly bottom: number };
        };
        readonly PANEL_POPOUT_BUTTON: { readonly neutral: number; readonly hovered: number; readonly mousedown: number };
        readonly PANEL_DOCK_BUTTON: { readonly neutral: number; readonly hovered: number; readonly mousedown: number };
        readonly ITEM_SLOT_BACKGROUND: number;
        readonly ITEM_GRID_BACKGROUND: number;
        readonly ITEM_GRID_DROP_TARGET: number;
        readonly DIVIDER: number;
        readonly ICON_TAB: { readonly inactive: number; readonly hovered: number; readonly active: number; readonly disabled: number };
        readonly TEXT_TAB: { readonly disabled: ThreePartSprites; readonly inactive: ThreePartSprites; readonly active: ThreePartSprites };
        readonly SIMPLE_BUTTON: { readonly disabled: FrameSprites; readonly neutral: FrameSprites; readonly hovered: FrameSprites; readonly active: FrameSprites };
        readonly COLLAPSE_BUTTON: { readonly disabled: ThreePartSprites; readonly neutral: ThreePartSprites; readonly hovered: ThreePartSprites; readonly active: ThreePartSprites };
        readonly FANCY_BUTTON: {
            readonly positive: { readonly normal: ThreePartSprites; readonly hovered: ThreePartSprites; readonly pressed: ThreePartSprites; readonly disabled: ThreePartSprites };
            readonly neutral: { readonly normal: ThreePartSprites; readonly hovered: ThreePartSprites; readonly pressed: ThreePartSprites; readonly disabled: ThreePartSprites };
            readonly negative: { readonly normal: ThreePartSprites; readonly hovered: ThreePartSprites; readonly pressed: ThreePartSprites; readonly disabled: ThreePartSprites };
        };
        readonly RADIO_BUTTON: { readonly empty: number; readonly emptyHovered: number; readonly selected: number; readonly selectedHovered: number };
        readonly CHECKBOX_BUTTON: { readonly empty: number; readonly emptyHovered: number; readonly selected: number; readonly selectedHovered: number };
        readonly SPRITE_BUTTONS: { readonly [name: string]: SpriteButtonSet | undefined };
        readonly SPRITE_BUTTON_NAMES: string[];
    }

    const Sprites: SpriteTable;
}
