/** @noSelfInFile */

declare namespace NPCList {
    function All(): NPCEntityProxy[];
    function ByName(name: string): NPCEntityProxy[];
    function ByConfig(config: NPCTypeProxy): NPCEntityProxy[];
    function ByConfigID(id: number): NPCEntityProxy[];
    function ByParentConfig(config: NPCTypeProxy): NPCEntityProxy[];
    function ByParentConfigID(id: number): NPCEntityProxy[];
    function ByDistance(range: number): NPCEntityProxy[];
    function ByUID(uid: number): NPCEntityProxy | undefined;
    function Filter(filter: EntityFilter): NPCEntityProxy[];
}
