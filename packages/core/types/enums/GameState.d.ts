/** @noSelfInFile */

declare enum GameState {
    BOOT = 0,
    INIT = 1,
    LOGINSCREEN = 10,
    LOBBY = 20,
    ACCOUNT_CREATE = 23,
    GAME = 30,
    RECONNECTING = 35,
    RECONNECTING_FULL = 36,
    SWITCH_WORLD = 37,
    LOADING = 40,
}
declare namespace GameState {
    function FromID(id: number): GameState;
}
