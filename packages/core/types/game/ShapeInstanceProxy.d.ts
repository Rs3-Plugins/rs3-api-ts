/** @noSelfInFile */

interface ShapeInstanceProxy {
    translation: Vector3;
    visible: boolean;
    ignoreDepth: boolean;
    asBillboard: boolean;
    lineWidth: number;
    drawDistance: number;
    alignType: ShapeEntityAlignType;
    heightOffset: HeightOffsetType;
    rotationSpeed: number;
    tileRange: number;
}
