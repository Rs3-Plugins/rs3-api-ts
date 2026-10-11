/** @noSelfInFile */

declare namespace ui {
    enum AlignMode {
        TOPLEFT = 0,
        CENTRE = 1,
        BOTTOMRIGHT = 2,
        JUSTIFY = 3,
    }
    namespace AlignMode {
        function FromID(id: number): AlignMode;
    }
}
