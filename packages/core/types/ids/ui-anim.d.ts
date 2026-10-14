/// <reference path="../config/AssetID.d.ts" />

declare namespace id {
    type UIAnimName =
        | "ANIM_MOVE_NORTH_EAST"
        | "ANIM_MOVE_NORTH_WEST"
        | "ANIM_MOVE_NORTH_WOBBLE"
        | "FADE_QUICK_IN_SLOW_OUT"
        | "FULL_FADE_IN"
        | "FULL_FADE_OUT"
        | "PARTIAL_EXPAND_DEFLATE"
        | "PARTIAL_FADE_IN"
        | "PARTIAL_FADE_IN_OUT"
        | "PARTIAL_FADE_OUT_FULL"
        | "PARTIAL_FADE_OUT_IN"
        | "SUBTLE_FADE"
        | "TEST_UIANIMS_COLOURCHANGE"
        | "TEST_UIANIMS_MULTIPLYALPHA"
        | "TEST_UIANIMS_PULSE"
        | "TEST_UIANIMS_RESIZE";

    type UIAnimIds = { readonly [N in UIAnimName]: AssetID<"UIAnim"> };

    interface UIAnim extends UIAnimIds {}
}
