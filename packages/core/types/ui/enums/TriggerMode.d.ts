/** @noSelfInFile */

declare namespace ui {
    enum TriggerMode {
        ONPRESS_FINISH = 0,
        ONPRESS = 1,
        ONRELEASE = 2,
        REPEAT = 3,
    }
    namespace TriggerMode {
        function FromID(id: number): TriggerMode;
    }
}
