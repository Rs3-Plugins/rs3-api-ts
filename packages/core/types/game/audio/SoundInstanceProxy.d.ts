/** @noSelfInFile */

declare namespace audio {
    interface SoundInstanceProxy {
        readonly isPlaying: boolean;
        readonly isPaused: boolean;
        Pause(): void;
        Resume(): void;
    }
}
