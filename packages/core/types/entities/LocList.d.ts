/** @noSelfInFile */

declare namespace LocList {
    function All(): LocEntityProxy[];
    function ByName(name: string): LocEntityProxy[];
    function ByConfig(config: LocTypeProxy): LocEntityProxy[];
    function ByConfigID(id: number): LocEntityProxy[];
    function ByParentConfig(config: LocTypeProxy): LocEntityProxy[];
    function ByParentConfigID(id: number): LocEntityProxy[];
    function ByDistance(range: number): LocEntityProxy[];
    function Filter(filter: EntityFilter): LocEntityProxy[];
}
