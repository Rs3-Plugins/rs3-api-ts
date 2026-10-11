/** @noSelfInFile */

declare namespace ui {
    enum RadialProgressOverlayFlag {
        AUTOMATIC = 1,
        REVERSE = 2,
        FLIP_HORIZONTAL = 4,
        FLIP_VERTICAL = 8,
    }
    namespace RadialProgressOverlayFlag {
        function FromID(id: number): RadialProgressOverlayFlag;
    }
}
