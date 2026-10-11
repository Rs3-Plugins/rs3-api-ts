/** @noSelfInFile */

declare namespace ObjStackList {
    function All(): ObjStackEntityProxy[];
    function ByName(name: string): ObjStackEntityProxy[];
    function ByConfig(config: ObjTypeProxy): ObjStackEntityProxy[];
    function ByConfigID(id: number): ObjStackEntityProxy[];
    function ByDistance(range: number): ObjStackEntityProxy[];
    function Filter(filter: EntityFilter): ObjStackEntityProxy[];
}
