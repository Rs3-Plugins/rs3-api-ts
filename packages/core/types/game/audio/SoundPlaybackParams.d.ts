/** @noSelfInFile */

declare namespace audio {
    interface SoundPlaybackParams {
        volume?: number;
        numLoops?: number;
        minDistance?: number;
        maxDistance?: number;
        minMaxRange?: Vector2;
        audioBus?: AudioBus;
        emitterShape?: EmitterShape;
        origin?: Vector3;
        delayTick?: number;
        samplingRate?: number;
    }
}
