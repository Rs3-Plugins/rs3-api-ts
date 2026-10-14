/** @noSelfInFile */

declare namespace prettyui {
    interface CollapseButtonOptions extends PositionOptions {
        disabled?: boolean;
        expanded?: boolean;
        resizeParent?: boolean;
        indent?: number;
        onToggle?: (this: void, section: CollapseButton, expanded: boolean) => void;
        hoverCursor?: CursorValue;
        colour?: Colour;
        disabledColour?: Colour;
        shadowed?: boolean;
        width?: number;
        widthAnchor?: number;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.CollapseButton.new */
    class CollapseButton {
        constructor(parent: Component, text: string, options?: CollapseButtonOptions);
        readonly root: Layer;
        readonly content: Layer;
        readonly interfaceID: number;
        readonly text: string;
        readonly expanded: boolean;
        readonly disabled: boolean;
        readonly contentHeight: number;
        AddSimpleButton(content: string | number, action: SimpleButtonAction | undefined, options?: SimpleButtonOptions & SectionItemOptions): SimpleButton;
        AddFancyButton(text: string, action: FancyButtonAction | undefined, options?: FancyButtonOptions & SectionItemOptions): FancyButton;
        AddSlider(options?: SliderOptions & SectionItemOptions): Slider;
        AddTextField(options?: TextFieldOptions & SectionItemOptions): TextField;
        AddKeybindField(options?: KeybindFieldOptions & SectionItemOptions): KeybindField;
        AddComboBox(options?: ComboBoxOptions & SectionItemOptions): ComboBox;
        AddList(options?: ListOptions & SectionItemOptions): List;
        AddText(value: string | number | (TextOptions & SectionItemOptions)): globalThis.Text;
        SetExpanded(expanded: boolean): void;
        Toggle(): void;
        SetDisabled(disabled: boolean): void;
        SetText(text: string): void;
        SetHoverCursor(cursor: CursorValue | undefined): void;
        BindFlow(owner: FlowOwner): this;
    }
    interface CollapseButton extends HasTooltip, Destroyable {}
    namespace CollapseButton {
        function getSize(text: string | undefined, options?: CollapseButtonOptions): Size;
    }

    interface SectionItemOptions {
        y?: number;
        marginTop?: number;
    }
}
