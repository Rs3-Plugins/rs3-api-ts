/** @noSelfInFile */

declare class Matrix33 {
    static fromQuaternion(rotation: Quaternion): Matrix33;
    static rotationY(radians: number): Matrix33;
}
