/** @noSelfInFile */

declare namespace ui {
    enum SwipeDirectionBit {
        RIGHT = 1,
        LEFT = 2,
        UP = 4,
        DOWN = 8,
    }
    namespace SwipeDirectionBit {
        function FromID(id: number): SwipeDirectionBit;
    }
}
