/** @noSelfInFile */

interface LocEvent {
    readonly coordGrid: CoordGrid;
    readonly config: LocTypeProxy;
    readonly shapeType: LocShapeType;
    readonly rotationType: RotationType;
    readonly overrideTransform: boolean;
    readonly transformScale: Vector3;
    readonly transformTranslate: Vector3;
    readonly transformRotation: Quaternion;
}
