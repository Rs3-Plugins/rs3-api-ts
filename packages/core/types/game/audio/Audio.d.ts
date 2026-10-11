/** @noSelfInFile */

declare namespace audio {
    function Play(resource: PluginSoundResource, params?: SoundPlaybackParams): SoundInstanceProxy | undefined;
    function Stop(instance: SoundInstanceProxy): void;
    function StopSoundsUsingResource(resource: PluginSoundResource): void;
}
