/** @noSelfInFile */

declare namespace ui {
    enum CheckAlignMode {
        LEFT = -1,
        INLINE = 0,
        RIGHT = 1,
        INLINE_INVERTED = 2,
    }
    namespace CheckAlignMode {
        function FromID(id: number): CheckAlignMode;
    }
}
