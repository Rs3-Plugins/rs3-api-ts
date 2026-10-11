/** @noSelfInFile */

declare namespace Keyboard {
    function IsAvailable(): boolean;
    function IsBlocked(): boolean;
    function IsControlDown(): boolean;
    function IsShiftDown(): boolean;
    function IsMetaDown(): boolean;
    function IsAltDown(): boolean;
    function IsGameKeyDown(key: GameKey): boolean;
    function GetGameKeysDown(): GameKey[];
}
