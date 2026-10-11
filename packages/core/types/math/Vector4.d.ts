/** @noSelfInFile */

/** @customConstructor Vector4.new */
declare class Vector4 {
    constructor(x: number, y: number, z: number, w: number);
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
    readonly xy: Vector2;
    readonly zw: Vector2;
    readonly xyz: Vector3;
    readonly length: number;
    readonly lengthSq: number;
    Dot(other: Vector4): number;
    Normalise(): Vector4;
}
