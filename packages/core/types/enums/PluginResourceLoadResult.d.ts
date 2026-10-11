/** @noSelfInFile */

declare enum PluginResourceLoadResult {
    SUCCESS = 0,
    ERROR_FILESYSTEM = 1,
    ERROR_DECODE = 2,
    ERROR_EXCEEDS_LIMITS = 3,
    ERROR_CONSTRUCTION = 4,
}
declare namespace PluginResourceLoadResult {
    function FromID(id: number): PluginResourceLoadResult;
}
