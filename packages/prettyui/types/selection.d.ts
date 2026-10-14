/** @noSelfInFile */

declare namespace prettyui {
    type SelectionValue = string | number | boolean;

    interface SelectionChoiceOptions<V> {
        text?: string;
        label?: string;
        value?: V;
        selected?: boolean;
        disabled?: boolean;
        tooltip?: TooltipValue;
    }

    type SelectionChoice<V> = V | SelectionChoiceOptions<V>;

    interface SelectionButtonOptions extends PositionOptions {
        inline?: boolean;
        width?: number;
        widthAnchor?: number;
        disabled?: boolean;
        colour?: Colour;
        disabledColour?: Colour;
        tickCursor?: CursorValue;
        crossCursor?: CursorValue;
        shadowed?: boolean;
        tooltip?: TooltipValue;
    }

    interface RadioButtonOptions<V> extends SelectionButtonOptions {
        selectedValue?: V;
        onChange?: (this: void, control: RadioButton<V>, value: V | undefined) => void;
    }

    interface CheckboxButtonOptions<V> extends SelectionButtonOptions {
        selectedValues?: ReadonlyArray<V> | Partial<Record<string, boolean>>;
        onChange?: (this: void, control: CheckboxButton<V>, values: V[], value: V, selected: boolean) => void;
    }

    interface SelectionButton<V> extends HasTooltip, Destroyable {
        readonly root: Layer;
        readonly interfaceID: number;
        readonly kind: "radio" | "checkbox";
        readonly disabled: boolean;
        readonly selectedValue: V | undefined;
        readonly selectedValues: V[];
        IsSelected(value: V): boolean;
        GetSelectedValue(): V | undefined;
        SetSelectedValue(value: V | undefined, notify?: boolean): boolean;
        GetSelectedValues(): V[];
        SetSelected(value: V, selected: boolean, notify?: boolean): boolean;
        SetDisabled(disabled: boolean): void;
        SetOptionTooltip(value: V, tooltip: TooltipValue | undefined): boolean;
    }

    /** @customConstructor prettyui.RadioButton.new */
    class RadioButton<V = SelectionValue> {
        constructor(parent: Component, choices: ReadonlyArray<SelectionChoice<V>>, options?: RadioButtonOptions<V>);
    }
    interface RadioButton<V = SelectionValue> extends SelectionButton<V> {}
    namespace RadioButton {
        function getSize(choices: ReadonlyArray<SelectionChoice<unknown>>, options?: SelectionButtonOptions): Size;
    }

    /** @customConstructor prettyui.CheckboxButton.new */
    class CheckboxButton<V = SelectionValue> {
        constructor(parent: Component, choices: ReadonlyArray<SelectionChoice<V>>, options?: CheckboxButtonOptions<V>);
    }
    interface CheckboxButton<V = SelectionValue> extends SelectionButton<V> {}
    namespace CheckboxButton {
        function getSize(choices: ReadonlyArray<SelectionChoice<unknown>>, options?: SelectionButtonOptions): Size;
    }

    interface SliderOptions extends PositionOptions {
        min?: number;
        max?: number;
        step?: number;
        value?: number;
        onChange?: (this: void, slider: Slider, value: number) => void;
        disabled?: boolean;
        buttonGap?: number;
        hoverCursor?: CursorValue;
        width?: number;
        widthAnchor?: number;
        tooltip?: TooltipValue;
    }

    /** @customConstructor prettyui.Slider.new */
    class Slider {
        constructor(parent: Component, options?: SliderOptions);
        readonly root: Layer;
        readonly interfaceID: number;
        readonly value: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly disabled: boolean;
        SetValue(value: number, notify?: boolean): boolean;
        GetValue(): number;
        SetDisabled(disabled: boolean): void;
    }
    interface Slider extends HasTooltip, Destroyable {}
    namespace Slider {
        function getSize(options?: SliderOptions): Size;
    }

    interface ColourPickerOptions extends SimpleButtonOptions {
        value?: Colour;
        colour?: Colour;
        defaultColour?: Colour;
        onChange?: (this: void, picker: ColourPicker, colour: Colour) => void;
        alphaSlider?: boolean;
        showAlpha?: boolean;
        windowParent?: Component;
        overlayParent?: Component;
        buttonSize?: number;
        windowWidth?: number;
        windowHeight?: number;
        windowX?: number;
        windowY?: number;
        pickerX?: number;
        pickerY?: number;
        windowTitle?: string;
        title?: string;
        acceptText?: string;
        acceptWidth?: number;
        acceptVariant?: FancyButtonVariant;
    }

    /** @customConstructor prettyui.ColourPicker.new */
    class ColourPicker {
        constructor(parent: Component, options?: ColourPickerOptions);
        readonly root: Layer;
        readonly button: SimpleButton;
        readonly colour: Colour;
        readonly value: Colour;
        readonly disabled: boolean;
        readonly pickerWindow: Window | undefined;
        Open(): boolean;
        Close(): void;
        GetValue(): Colour;
        SetValue(colour: Colour, notify?: boolean): boolean;
        GetColour(): Colour;
        SetColour(colour: Colour, notify?: boolean): boolean;
        SetDisabled(disabled: boolean): void;
    }
    interface ColourPicker extends Destroyable {}
    namespace ColourPicker {
        function getSize(options?: ColourPickerOptions): Size;
    }
}
