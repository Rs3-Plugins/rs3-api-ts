/** @noSelfInFile */

declare namespace ShapeList {
    function Draw(options: ShapeDrawOptions): void;
    function DrawLine(options: { positions: Vector3[]; rgba?: number }): void;
    function CreateEntity(options: ShapeDrawOptions): ShapeEntityProxy;
    function DestroyEntity(entity: ShapeEntityProxy): void;
    function GetEntity(id: number): ShapeEntityProxy | undefined;
    function GetAllEntities(): ShapeEntityProxy[];
    function CreateInstance(entity: ShapeEntityProxy, options?: Partial<ShapeInstanceProxy>): ShapeInstanceProxy;
    function DestroyInstance(instance: ShapeInstanceProxy): void;
    function GetInstance(id: number): ShapeInstanceProxy | undefined;
    function GetAllInstances(): ShapeInstanceProxy[];
}
