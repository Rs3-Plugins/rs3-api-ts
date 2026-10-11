/** @noSelfInFile */

interface HintPolygonOptions {
    name: string;
    coordGrid: CoordGrid;
    polygon: number[];
    fillRGBA?: number;
    outlineRGBA?: number;
    drawOnMiniMap?: boolean;
    drawOnWorldMap?: boolean;
}
