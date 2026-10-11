/** @noSelfInFile */

interface Component {
    readonly staticID: number;
    readonly dynamicID: number;
    readonly parent: Component | undefined;
    readonly parentInterface: Interface | undefined;
    readonly stylesheetID: number;
    readonly xyLocal: Vector2;
    readonly xyGlobal: Vector2;
    readonly isRestricted: boolean;
    readonly isMouseOver: boolean;
    readonly isClicked: boolean;
    readonly visibleGlobal: boolean;
    readonly content: string | undefined;
    readonly label: string | undefined;
    readonly text: string | undefined;
    hidden: boolean;
    readonly opConfig: unknown;
    readonly dragConfig: unknown;
    readonly cursorConfig: unknown;
    readonly pinchConfig: unknown;
    readonly swipeConfig: unknown;
    SetPos(x: number, y: number): void;
    SetSize(width: number, height: number): void;
    SetWidth(width: number): void;
    SetHeight(height: number): void;
    SetAspectRatio(mode: ui.AspectRatioMode): void;
    MoveToFront(): void;
    MoveToBack(): void;
    UpdateLayout(): void;
}
