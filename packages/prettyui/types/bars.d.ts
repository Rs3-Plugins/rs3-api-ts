/** @noSelfInFile */

declare namespace prettyui {
    interface BuffBarEntryOptions {
        spriteID?: number;
        objId?: number | ObjTypeProxy;
        label?: string;
        labelRgba?: Colour;
        backgroundRgba?: Colour;
        borderRgba?: Colour;
        font?: number;
        tooltip?: TooltipValue;
        visible?: boolean;
        duration?: number;
    }

    interface BuffBarHandle {
        SetVisible(visible: boolean): boolean;
        SetLabel(text: string | undefined, rgba?: Colour): boolean;
        SetObject(value: number | ObjTypeProxy | undefined): boolean;
        SetSprite(spriteID: number | undefined): boolean;
        SetTooltip(value: TooltipValue | undefined): boolean;
    }

    namespace BuffBar {
        function addBuff(options?: BuffBarEntryOptions): BuffBarHandle | undefined;
        function removeBuff(handle: BuffBarHandle | undefined): boolean;
        function addDebuff(options?: BuffBarEntryOptions): BuffBarHandle | undefined;
        function removeDebuff(handle: BuffBarHandle | undefined): boolean;
        function Shutdown(): void;
    }

    type RibbonBarPosition = "left" | "right" | "top";

    interface RibbonBarEntryOptions {
        id?: string;
        identifier?: string;
        icon?: number;
        object?: ObjTypeProxy;
        tooltip?: TooltipValue;
        label?: string;
        active?: boolean;
        disabled?: boolean;
        onClick?: (this: void, handle: RibbonBarHandle, active: boolean) => void;
    }

    interface RibbonBarHandle {
        readonly id: string;
        SetActive(active: boolean): boolean;
        SetIcon(icon: number): boolean;
        SetTooltip(value: TooltipValue | undefined): boolean;
        Destroy(): boolean;
    }

    namespace RibbonBar {
        function Register(options: RibbonBarEntryOptions): RibbonBarHandle;
        function Unregister(identifier: string): boolean;
        function SetPosition(value: RibbonBarPosition): void;
        function GetPosition(): RibbonBarPosition;
        function SetAutoHide(value: boolean): void;
        function GetAutoHide(): boolean;
        function Start(): void;
        function Shutdown(): void;
    }
}
