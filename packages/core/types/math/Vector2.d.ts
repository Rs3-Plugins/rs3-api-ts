/** @noSelfInFile */

/** @customConstructor Vector2.new */
declare class Vector2 {
    constructor(x: number, y: number);
    readonly x: number;
    readonly y: number;
    readonly length: number;
    readonly lengthSq: number;
    readonly invLength: number;
    readonly isNormal: boolean;
    Abs(): Vector2;
    Floor(): Vector2;
    Ceil(): Vector2;
    Min(other: Vector2): Vector2;
    Max(other: Vector2): Vector2;
    Dot(other: Vector2): number;
    Rotate(radians: number): Vector2;
    Reflect(normal: Vector2): Vector2;
    Normalise(): Vector2;
    NormaliseSafe(): Vector2;
}
