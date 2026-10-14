/** @noSelfInFile */

type ComponentHookHandler = (this: void, component: Component, ...args: any[]) => boolean | void;

interface Component {
    readonly staticID: number;
    readonly dynamicID: number;
    readonly interfaceID: number;
    readonly parent: Component | undefined;
    readonly parentInterface: Interface | undefined;
    readonly stylesheetID: number;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
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
    alpha: number;
    clickthrough: boolean;
    enabled: boolean;
    readonly opConfig: unknown;
    readonly dragConfig: unknown;
    readonly cursorConfig: unknown;
    readonly pinchConfig: unknown;
    readonly swipeConfig: unknown;
    SetPos(x: number, y: number, xAnchor?: number, yAnchor?: number): void;
    SetSize(width: number, height: number, widthAnchor?: number, heightAnchor?: number): void;
    SetWidth(width: number, widthAnchor?: number): void;
    SetHeight(height: number, heightAnchor?: number): void;
    SetAspectRatio(mode: ui.AspectRatioMode): void;
    MoveToFront(): void;
    MoveToBack(): void;
    UpdateLayout(): void;
    Subscribe(hook: number, handler: ComponentHookHandler): void;
    Subscribe(hook: number, id: string, handler: ComponentHookHandler): void;
    Unsubscribe(hook: number, id?: string): void;
    Destroy(): void;
}
