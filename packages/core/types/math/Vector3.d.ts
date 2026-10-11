/** @noSelfInFile */

/** @customConstructor Vector3.new */
declare class Vector3 {
    constructor(x: number, y: number, z: number);
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly xy: Vector2;
    readonly length: number;
    readonly lengthSq: number;
    readonly invLength: number;
    readonly isNormal: boolean;
    Abs(): Vector3;
    Floor(): Vector3;
    Ceil(): Vector3;
    Min(other: Vector3): Vector3;
    Max(other: Vector3): Vector3;
    Dot(other: Vector3): number;
    Cross(other: Vector3): Vector3;
    Reflect(normal: Vector3): Vector3;
    Normalise(): Vector3;
    NormaliseSafe(): Vector3;
}
