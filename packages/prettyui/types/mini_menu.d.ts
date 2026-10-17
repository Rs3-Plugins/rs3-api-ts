/** @noSelfInFile */

declare namespace prettyui {
    interface MiniMenu {
    }
    namespace MiniMenu {
        function AddSubmenu(miniMenu: unknown, label?: string, children?: number, options?: unknown): unknown;
        function Start(): void;
        function Shutdown(): void;
    }
}
