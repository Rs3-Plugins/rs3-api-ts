/** @noSelfInFile */

declare namespace ui {
    enum InputFieldKeyHandlingMode {
        DEFAULT = 0,
        CHAT = 1,
    }
    namespace InputFieldKeyHandlingMode {
        function FromID(id: number): InputFieldKeyHandlingMode;
    }
}
