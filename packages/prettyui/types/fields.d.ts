/** @noSelfInFile */

declare namespace prettyui {
    interface TextFieldOptions extends PositionOptions, SizeOptions {
        width?: number;
        height?: number;
        onChange?: (this: void, field: TextField, reason: ui.InputFieldActionResult, content: string) => void;
        onSubmit?: (this: void, field: TextField, content: string) => void;
        disabled?: boolean;
        stylesheetID?: number;
        visibility?: ui.TextContentVisibilityMode;
        filterMode?: ui.InputFieldFilterMode;
        filter?: ui.InputFieldFilterMode;
        maxLength?: number;
        inputMode?: ui.InputFieldKeyHandlingMode;
        placeholder?: string;
        emptyText?: string;
        text?: string;
        content?: string;
        contentMargin?: ui.Margin;
        font?: number;
        colour?: Colour;
        color?: Colour;
        shadowed?: boolean;
        placeholderColour?: Colour;
        placeholderColor?: Colour;
        caretColour?: Colour;
        caretColor?: Colour;
        selectionColour?: Colour;
        selectionColor?: Colour;
        inputSprite?: PluginResource;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.TextField.new */
    class TextField {
        constructor(parent: Component, options?: TextFieldOptions);
        readonly root: InputField;
        readonly interfaceID: number;
        readonly disabled: boolean;
        GetText(): string;
        SetText(value: string | number | undefined, triggerCallback?: boolean): void;
        SetPlaceholder(value: string | undefined): void;
        SetDisabled(disabled: boolean): void;
    }
    interface TextField extends HasTooltip, Destroyable {}
    namespace TextField {
        function SetDefaultSprite(sprite: PluginResource | undefined): void;
        function getSize(options?: TextFieldOptions): Size;
    }

    type Keybind = GameKey[];

    interface KeybindFieldOptions extends PositionOptions, SizeOptions {
        value?: Keybind;
        defaultValue?: Keybind;
        onChange?: (this: void, field: KeybindField, value: Keybind) => void;
        disabled?: boolean;
        colour?: Colour;
        color?: Colour;
        font?: number;
        shadowed?: boolean;
        stylesheetID?: number;
        inputSprite?: PluginResource;
    }

    /** @customConstructor prettyui.KeybindField.new */
    class KeybindField {
        constructor(parent: Component, options?: KeybindFieldOptions);
        readonly root: Layer;
        readonly input: TextField;
        readonly interfaceID: number;
        readonly disabled: boolean;
        readonly defaultValue: Keybind | undefined;
        StartListening(): void;
        CancelListening(): void;
        IsListening(): boolean;
        GetValue(): Keybind;
        SetValue(value: Keybind | undefined, notify?: boolean): void;
        SetDisabled(disabled: boolean): void;
    }
    interface KeybindField extends Destroyable {}
    namespace KeybindField {
        function FormatValue(value: Keybind | undefined): string;
        function IsCapturing(): boolean;
        function IsDown(value: Keybind | undefined): boolean;
        function Shutdown(): void;
        function getSize(options?: KeybindFieldOptions): Size;
    }

    type EntryID = string | number;

    interface ComboBoxEntryOptions {
        label?: string;
        text?: string;
        id?: EntryID;
        value?: EntryID;
        order?: number;
    }

    type ComboBoxEntry = string | ComboBoxEntryOptions;

    interface ComboBoxOptions extends PositionOptions, SizeOptions {
        width?: number;
        height?: number;
        entries?: ReadonlyArray<ComboBoxEntry>;
        choices?: ReadonlyArray<ComboBoxEntry>;
        selectedID?: EntryID;
        selected?: EntryID;
        onChange?: (this: void, box: ComboBox, entryID: EntryID, label: string | undefined, eventType: ui.SelectionChangeEvent) => void;
        disabled?: boolean;
        stylesheetID?: number;
        entryHeight?: number;
        maxVisibleEntries?: number;
        dropdownMaxVisibleEntries?: number;
        contentMargin?: ui.Margin;
        headerMargin?: ui.Margin;
        font?: number;
        colour?: Colour;
        color?: Colour;
        shadowed?: boolean;
        hoverTextColour?: Colour;
        hoverTextColor?: Colour;
        hoverColour?: Colour;
        hoverColor?: Colour;
        selectedTextColour?: Colour;
        selectedTextColor?: Colour;
        selectedColour?: Colour;
        selectedColor?: Colour;
        disabledTextColour?: Colour;
        disabledTextColor?: Colour;
        selectionColour?: Colour;
        selectionColor?: Colour;
        caretColour?: Colour;
        caretColor?: Colour;
        errorCaretColour?: Colour;
        errorCaretColor?: Colour;
        tooltip?: TooltipValue;
        inputStylesheetID?: number;
        maxLength?: number;
        inputMode?: ui.InputFieldKeyHandlingMode;
        placeholderColour?: Colour;
        placeholderColor?: Colour;
        dropdownBackgroundColour?: Colour;
        dropdownBackgroundColor?: Colour;
        dropdownBorderColour?: Colour;
        dropdownBorderColor?: Colour;
        overlayParent?: Component;
    }

    /** @customConstructor prettyui.ComboBox.new */
    class ComboBox {
        constructor(parent: Component, options?: ComboBoxOptions);
        readonly root: ComboField | Layer;
        readonly interfaceID: number;
        readonly disabled: boolean;
        Add(label: string, entryID: EntryID): boolean;
        Remove(entryID: EntryID): boolean;
        Clear(): void;
        SetEntries(entries: ReadonlyArray<ComboBoxEntry>, selectedID?: EntryID): void;
        Select(entryID: EntryID, triggerEvents?: boolean): boolean;
        GetSelectedID(): EntryID | undefined;
        GetSelectedLabel(): string | undefined;
        SetDisabled(disabled: boolean): void;
    }
    interface ComboBox extends HasTooltip, Destroyable {}
    namespace ComboBox {
        function getSize(options?: ComboBoxOptions): Size;
    }

    interface ListEntryOptions {
        label?: string;
        text?: string;
        id?: EntryID;
        value?: EntryID;
        enabled?: boolean;
        disabled?: boolean;
        visible?: boolean;
        selected?: boolean;
        icon?: number;
        backgroundColour?: Colour;
        backgroundColor?: Colour;
        hoverColour?: Colour;
        hoverColor?: Colour;
        selectedColour?: Colour;
        selectedColor?: Colour;
        textColour?: Colour;
        textColor?: Colour;
        colour?: Colour;
        color?: Colour;
        disabledTextColour?: Colour;
        disabledTextColor?: Colour;
    }

    type ListEntry = string | ListEntryOptions;

    interface ListEntryState {
        readonly id: EntryID;
        readonly text: string;
        readonly enabled: boolean;
        readonly visible: boolean;
        readonly selected: boolean;
        readonly icon: number | undefined;
    }

    interface ListOptions extends PositionOptions, SizeOptions {
        width?: number;
        height?: number;
        entries?: ReadonlyArray<ListEntry>;
        choices?: ReadonlyArray<ListEntry>;
        onChange?: (this: void, list: List, entryID: EntryID, selected: boolean, eventType: ui.SelectionChangeEvent) => void;
        disabled?: boolean;
        maxSelected?: number;
        entryHeight?: number;
        entryIconScale?: number;
        font?: number;
        colour?: Colour;
        color?: Colour;
        disabledColour?: Colour;
        disabledColor?: Colour;
        backgroundColour?: Colour;
        backgroundColor?: Colour;
        borderColour?: Colour;
        borderColor?: Colour;
        hoverColour?: Colour;
        hoverColor?: Colour;
        selectedColour?: Colour;
        selectedColor?: Colour;
        shadowed?: boolean;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.List.new */
    class List {
        constructor(parent: Component, options?: ListOptions);
        readonly root: Layer;
        readonly interfaceID: number;
        readonly disabled: boolean;
        readonly entries: ListEntryState[];
        SetSize(width?: number, height?: number, widthAnchor?: number, heightAnchor?: number): void;
        SetScrollPosition(value: number): void;
        Add(label: string, entryID: EntryID): boolean;
        Clear(): void;
        SetEntries(entries: ReadonlyArray<ListEntry> | undefined): void;
        SetSelected(entryID: EntryID, selected: boolean, triggerEvents?: boolean): boolean;
        UnselectAll(): void;
        SetEntryEnabled(entryID: EntryID, enabled: boolean): boolean;
        SetEntryVisible(entryID: EntryID, visible: boolean): boolean;
        SetEntryIcon(entryID: EntryID, spriteID: number | undefined): boolean;
        GetSelectedEntries(): ListEntryState[];
        SetDisabled(disabled: boolean): void;
    }
    interface List extends HasTooltip, Destroyable {}
    namespace List {
        function getSize(options?: ListOptions): Size;
    }
}
