/** @noSelfInFile */

declare namespace audio {
    enum AudioBus {
        MASTER = 0,
        SFX = 1,
        MUSIC = 2,
        MUSIC_LOGIN = 3,
        AMBIENT = 4,
        VOICEOVER = 5,
        SFX_SUB = 6,
        MUSIC_SUB = 7,
        DIALOG_SUB = 8,
        PLAYER_ANIMATION_SUB = 9,
        NPC_ANIMATION_SUB = 10,
        LOCATION_ANIMATION_SUB = 11,
        GENERAL_ANIMATION_SUB = 12,
        LOCATIONS_SUB = 13,
        LOCATION_RANDOM_SUB = 14,
        LOCATION_GENERIC_SUB = 15,
    }
    namespace AudioBus {
        function FromID(id: number): AudioBus;
    }
}
