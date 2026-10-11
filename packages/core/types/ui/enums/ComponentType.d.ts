/** @noSelfInFile */

declare namespace ui {
    enum ComponentType {
        LINE = 0,
        RECTANGLE = 1,
        LABEL = 2,
        SPRITE = 3,
        MODEL = 4,
        MODEL_GROUP = 5,
        RADIAL_PROGRESS_OVERLAY = 6,
        CUTSCENE_LAYER = 7,
        CANVAS = 8,
        BUTTON = 9,
        CHECK = 10,
        LIST = 11,
        INPUTFIELD = 12,
        SLIDER = 13,
        COMBO = 14,
        PAGED_LAYER_HEADER = 15,
        CAROUSEL = 16,
        PAGED_CAROUSEL = 17,
        RADIO_GROUP = 18,
        LAYER = 20,
        PANEL = 21,
        GRID = 22,
        PAGED_LAYER = 23,
        GROUP_BOX = 24,
    }
    namespace ComponentType {
        function FromID(id: number): ComponentType;
    }
}
