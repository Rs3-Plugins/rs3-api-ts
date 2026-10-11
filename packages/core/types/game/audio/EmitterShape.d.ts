/** @noSelfInFile */

declare namespace audio {
    enum EmitterShape {
        SPHERE = 0,
        BOX = 1,
        SPHERE_NO_PANNING = 2,
        BOX_NO_PANNING = 3,
        NONE = 4,
    }
    namespace EmitterShape {
        function FromID(id: number): EmitterShape;
    }
}
