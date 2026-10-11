/** @noSelfInFile */

declare namespace ui {
    enum ObjectQuantityDisplayMode {
        NEVER = 0,
        ALWAYS = 1,
        MULTIPLE = 2,
    }
    namespace ObjectQuantityDisplayMode {
        function FromID(id: number): ObjectQuantityDisplayMode;
    }
}
