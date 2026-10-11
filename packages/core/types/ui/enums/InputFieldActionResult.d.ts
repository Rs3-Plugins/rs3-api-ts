/** @noSelfInFile */

declare namespace ui {
    enum InputFieldActionResult {
        NONE = -1,
        CONTENT_CHANGE = 0,
        ERROR = 1,
        SUBMIT = 2,
        SUBMIT_ON_ESCAPE = 3,
        SUBMIT_ON_FOCUS_LOSS = 4,
    }
    namespace InputFieldActionResult {
        function FromID(id: number): InputFieldActionResult;
    }
}
