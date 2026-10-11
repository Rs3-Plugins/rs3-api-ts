/** @noSelfInFile */

declare namespace World {
    function IsAvailable(): boolean;
    function IsMembers(): boolean;
    function IsRegion(): boolean;
    function GetRebootTimer(): number;
    function GetPing(): number;
    function GetMapSquareBounds(): WorldCreatedEvent;
    function GetRegionSourceForCoordGrid(coord: CoordGrid): CoordGrid | undefined;
    function GetGroundHeight(coord: CoordGrid, offset?: HeightOffsetType): number;
    namespace RemoveRoof {
        function Add(coord: CoordGrid): void;
        function Remove(coord: CoordGrid): void;
        function Clear(): void;
    }
}
