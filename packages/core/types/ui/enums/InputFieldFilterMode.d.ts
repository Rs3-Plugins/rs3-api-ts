/** @noSelfInFile */

declare namespace ui {
    enum InputFieldFilterMode {
        NONE = 0,
        ALPHANUMERIC = 1,
        NUMERIC = 2,
        QUANTITY = 3,
        NUMBERS_AS_TEXT = 4,
    }
    namespace InputFieldFilterMode {
        function FromID(id: number): InputFieldFilterMode;
    }
}
