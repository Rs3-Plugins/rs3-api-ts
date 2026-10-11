/** @noSelfInFile */

/** @customConstructor Quaternion.new */
declare class Quaternion {
    constructor(x: number, y: number, z: number, w: number);
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
    rotateBy(other: Quaternion): Quaternion;
    static fromYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion;
    static fromMatrix(matrix: Matrix33): Quaternion;
}
