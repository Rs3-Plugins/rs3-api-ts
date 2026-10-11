/** @noSelfInFile */

declare namespace PlayerList {
    function All(): PlayerEntityProxy[];
    function Self(): PlayerEntityProxy | undefined;
    function ByName(name: string): PlayerEntityProxy[];
    function ByDistance(range: number): PlayerEntityProxy[];
    function ByUID(uid: number): PlayerEntityProxy | undefined;
    function Filter(filter: EntityFilter): PlayerEntityProxy[];
}
