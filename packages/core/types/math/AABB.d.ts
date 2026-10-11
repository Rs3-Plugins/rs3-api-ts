/** @noSelfInFile */

/** @customConstructor AABB.new */
declare class AABB {
    constructor(minimum: Vector3, maximum: Vector3);
    readonly minimum: Vector3;
    readonly maximum: Vector3;
    readonly centre: Vector3;
    readonly dimensions: Vector3;
    readonly minX: number;
    readonly minY: number;
    readonly minZ: number;
    readonly maxX: number;
    readonly maxY: number;
    readonly maxZ: number;
    readonly radiusMinimum: number;
    readonly radiusMaximum: number;
    readonly radiusMinimumSq: number;
    readonly radiusMaximumSq: number;
    GetCorner(corner: BoxCornerType): Vector3;
    GetClosestPosition(position: Vector3): Vector3;
    GetFurthestPosition(position: Vector3): Vector3;
    GetDistanceToPosition(position: Vector3): number;
    IsInside(position: Vector3): boolean;
    AddPosition(position: Vector3): void;
    AddAABB(other: AABB): void;
    ScaleFromCentre(factor: number): AABB;
    Grow(amount: number): AABB;
    Shrink(amount: number): AABB;
    Intersects(other: AABB): boolean;
    GetIntersection(other: AABB): AABB;
    GetUnion(other: AABB): AABB;
}
