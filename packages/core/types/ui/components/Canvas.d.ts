/** @noSelfInFile */

interface Canvas extends Component {
    AddSprite(spriteId: number, x: number, y: number): void;
    AddText(text: string, x: number, y: number, fontId: number, rgba: number): void;
    AddRectangle(x: number, y: number, width: number, height: number, rgba: number): void;
    AddLine(x1: number, y1: number, x2: number, y2: number, rgba: number): void;
    AddTriangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, rgba: number): void;
    AddOutline(x: number, y: number, width: number, height: number, rgba: number): void;
    AddGradientH(x: number, y: number, width: number, height: number, rgbaLeft: number, rgbaRight: number): void;
    AddGradientV(x: number, y: number, width: number, height: number, rgbaTop: number, rgbaBottom: number): void;
}
