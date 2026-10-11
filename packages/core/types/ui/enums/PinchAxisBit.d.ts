/** @noSelfInFile */

declare namespace ui {
    enum PinchAxisBit {
        HORIZONTAL = 1,
        VERTICAL = 2,
    }
    namespace PinchAxisBit {
        function FromID(id: number): PinchAxisBit;
    }
}
