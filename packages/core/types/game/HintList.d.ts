/** @noSelfInFile */

declare namespace HintList {
    function AddArrow(options: HintArrowOptions): void;
    function HasArrow(name: string): boolean;
    function RemoveArrow(name: string): void;
    function AddPolygon(options: HintPolygonOptions): void;
    function HasPolygon(name: string): boolean;
    function RemovePolygon(name: string): void;
    function AddTrail(options: HintTrailOptions): void;
    function HasTrail(name: string): boolean;
    function RemoveTrail(name: string): void;
}
