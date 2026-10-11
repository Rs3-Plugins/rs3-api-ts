/** @noSelfInFile */

/** @customConstructor Rect.new */
declare class Rect {
    constructor(x: number, y: number, w: number, h: number);
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
    readonly left: number;
    readonly top: number;
    readonly centreX: number;
    readonly centreY: number;
    Scale(factor: number): Rect;
    Translate(dx: number, dy: number): Rect;
    Grow(amount: number): Rect;
    Shrink(amount: number): Rect;
    Intersects(other: Rect): boolean;
    GetIntersection(other: Rect): Rect;
    GetUnion(other: Rect): Rect;
}
