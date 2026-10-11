/** @noSelfInFile */

declare namespace ui {
    enum TextContentVisibilityMode {
        VISIBLE = 0,
        SHOW_LAST = 1,
        HIDDEN = 2,
    }
    namespace TextContentVisibilityMode {
        function FromID(id: number): TextContentVisibilityMode;
    }
}
