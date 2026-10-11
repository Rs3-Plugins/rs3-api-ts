/** @noSelfInFile */

declare namespace ui {
    enum ModelType {
        NONE = 0,
        MODEL = 1,
        NPC_HEAD = 2,
        PLAYER_HEAD = 3,
        OBJECT = 4,
        PLAYER_MODEL = 5,
        NPC_MODEL = 6,
        PLAYER_HEAD_NOWORN = 7,
        INV_MANWEAR_MODEL = 8,
        INV_WOMANWEAR_MODEL = 9,
    }
    namespace ModelType {
        function FromID(id: number): ModelType;
    }
}
