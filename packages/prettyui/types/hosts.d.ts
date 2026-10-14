/** @noSelfInFile */

declare namespace prettyui {
    type TextEntry = string | number | (TextOptions & FlowOptions);

    interface ContentMethods {
        AddText(value: TextEntry): globalThis.Text;
        AddTitle(value: TextEntry): globalThis.Text;
        AddSprite(sprite: SpriteSource, options?: SpriteOptions & FlowOptions): Sprite;
        AddSpinner(options?: SpinnerOptions & FlowOptions): Spinner;
        AddBigSpinner(options?: SpinnerOptions & FlowOptions): Spinner;
        AddTimeGraph(options: TimeGraphOptions & FlowOptions): TimeGraph;
        AddBarChart(options?: BarChartOptions & FlowOptions): BarChart;
        AddHistogram(options?: HistogramOptions & FlowOptions): Histogram;
        AddDivider(options?: DividerOptions & FlowOptions): Divider;
        AddItemSlot(object: ObjTypeProxy | undefined, options?: ItemSlotOptions & FlowOptions): ItemSlot;
        AddItemGrid(objects: ReadonlyArray<ItemGridEntry | undefined> | undefined, options?: ItemGridOptions & FlowOptions): ItemGrid;
        AddTabs(tabs: ReadonlyArray<TabSpec>, options?: TabsOptions & FlowOptions): Tabs;
        AddCollapseButton(text: string, options?: CollapseButtonOptions & FlowOptions): CollapseButton;
        AddRadioButton<V = SelectionValue>(choices: ReadonlyArray<SelectionChoice<V>>, options?: RadioButtonOptions<V> & FlowOptions): RadioButton<V>;
        AddCheckboxButton<V = SelectionValue>(choices: ReadonlyArray<SelectionChoice<V>>, options?: CheckboxButtonOptions<V> & FlowOptions): CheckboxButton<V>;
        AddColourPicker(options?: ColourPickerOptions & FlowOptions): ColourPicker;
        AddTextField(options?: TextFieldOptions & FlowOptions): TextField;
        AddKeybindField(options?: KeybindFieldOptions & FlowOptions): KeybindField;
        AddComboBox(options?: ComboBoxOptions & FlowOptions): ComboBox;
        AddList(options?: ListOptions & FlowOptions): List;
        AddRibbonButton(spriteID: number, action: RibbonButtonAction | undefined, options?: RibbonButtonOptions & FlowOptions): RibbonButton;
        AddSimpleButton(content: string | number, action: SimpleButtonAction | undefined, options?: SimpleButtonOptions & FlowOptions): SimpleButton;
        AddSlider(options?: SliderOptions & FlowOptions): Slider;
        AddFancyButton(text: string, action: FancyButtonAction | undefined, options?: FancyButtonOptions & FlowOptions): FancyButton;
        AddSpriteButton(spriteName: SpriteButtonName, action: SpriteButtonAction | undefined, options?: SpriteButtonOptions & FlowOptions): SpriteButton;
    }

    interface ContentHost extends ContentMethods {
        AddPanel(options?: PanelOptions & FlowOptions): Panel;
    }

    interface ScrollHost {
        readonly content: Layer;
        readonly viewport: Layer;
        readonly contentWidth: number;
        readonly contentHeight: number;
        readonly scrollbarVisible: boolean;
        readonly scrollable: boolean;
        readonly scrollY: number;
        SetContentHeight(contentHeight: number): void;
        SetScrollPosition(position: number): void;
        ScrollBy(delta: number): void;
        ScrollToChild(child: { readonly root?: Component } | Component | undefined, topOffset?: number): void;
        SetScrollable(scrollable: boolean): void;
    }

    interface RowBackgroundHost {
        RefreshRowBackgrounds(): void;
    }
}
