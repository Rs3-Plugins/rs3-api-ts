/** @noSelfInFile */

declare namespace ui {
    enum ModelCameraTransition {
        NONE = 0,
        FADE = 1,
        CROSSFADE = 2,
    }
    namespace ModelCameraTransition {
        function FromID(id: number): ModelCameraTransition;
    }
}
