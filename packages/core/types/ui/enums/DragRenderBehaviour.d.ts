/** @noSelfInFile */

declare namespace ui {
    enum DragRenderBehaviour {
        TRANSPARENT_OVERLAY = 0,
        OPAQUE = 1,
        OPAQUE_OVERLAY = 2,
        INVISIBLE = 3,
    }
    namespace DragRenderBehaviour {
        function FromID(id: number): DragRenderBehaviour;
    }
}
