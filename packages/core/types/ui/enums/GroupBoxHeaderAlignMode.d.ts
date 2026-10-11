/** @noSelfInFile */

declare namespace ui {
    enum GroupBoxHeaderAlignMode {
        LEFT = 0,
        CENTRE = 1,
        RIGHT = 2,
    }
    namespace GroupBoxHeaderAlignMode {
        function FromID(id: number): GroupBoxHeaderAlignMode;
    }
}
