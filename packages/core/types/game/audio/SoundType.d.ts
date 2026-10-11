/** @noSelfInFile */

declare namespace audio {
    enum SoundType {
        ENTITY = 0,
        LOCATION = 1,
        LOCATION_RANDOM = 2,
        GENERAL_ANIMATION = 3,
        LOCATION_ANIMATION = 4,
        ENTITY_ANIMATION = 5,
        SPOT_ANIMATION = 6,
        SCRIPT = 7,
        SERVER_TRIGGERED = 8,
        MUSIC = 9,
        JINGLE = 10,
        ENTITY_MOVEMENT = 11,
        INTERFACE_ANIMATION = 12,
        INVALID = 255,
    }
    namespace SoundType {
        function FromID(id: number): SoundType;
    }
}
