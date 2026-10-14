/// <reference path="../config/AssetID.d.ts" />

declare namespace id {
    type UIAnimCurveName =
        | "CUBIC_OUT"
        | "EASE_OUT_ELASTIC"
        | "INOUT_SINE"
        | "LINEAR"
        | "LINEAR_CHAIN"
        | "LINEAR_SIMPLE"
        | "LINEAR_SIMPLE_CONVERTED"
        | "TEST_UIANIMS_CUBIC_OUT"
        | "TEST_UIANIMS_EASE_OUT_ELASTIC"
        | "TEST_UIANIMS_INOUT_SINE"
        | "TEST_UIANIMS_LINEAR"
        | "TEST_UIANIMS_LINEAR_CHAIN"
        | "TEST_UIANIMS_LINEAR_SIMPLE"
        | "TEST_UIANIMS_LINEAR_SIMPLE_CONVERTED";

    type UIAnimCurveIds = { readonly [N in UIAnimCurveName]: AssetID<"UIAnimCurve"> };

    interface UIAnimCurve extends UIAnimCurveIds {}
}
