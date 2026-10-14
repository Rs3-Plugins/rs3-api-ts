/** @noSelfInFile */

declare namespace prettyui {
    interface PanelOptions extends PositionOptions, SizeOptions, HostOptions, RowBackgroundOptions {
        width?: number;
        height?: number;
        backgroundAlpha?: number;
        popout?: boolean;
        poppedOut?: boolean;
        popoutX?: number;
        popoutY?: number;
        popoutXAnchor?: number;
        popoutYAnchor?: number;
        popoutWidth?: number;
        popoutHeight?: number;
        popoutClickthrough?: boolean;
        popoutBackgroundAlpha?: number;
        onPopoutChange?: (this: void, panel: Panel, poppedOut: boolean) => void;
        overlayParent?: Component;
        minWidth?: number;
        minHeight?: number;
        maxWidth?: number;
        maxHeight?: number;
        resizable?: boolean;
    }

    interface PanelSurface {
        readonly root: Layer;
        readonly container: Layer;
        readonly content: Layer;
        readonly interfaceID: number;
    }

    type Paired<T> = T & {
        readonly dock: T;
        readonly overlay: T;
    };

    interface PanelContent extends ScrollHost, RowBackgroundHost {
        readonly interfaceID: number;
    }

    interface PanelContentMethods {
        AddText(value: TextEntry): Paired<globalThis.Text>;
        AddTitle(value: TextEntry): Paired<globalThis.Text>;
        AddSprite(sprite: SpriteSource, options?: SpriteOptions & FlowOptions): Paired<Sprite>;
        AddSpinner(options?: SpinnerOptions & FlowOptions): Paired<Spinner>;
        AddBigSpinner(options?: SpinnerOptions & FlowOptions): Paired<Spinner>;
        AddTimeGraph(options: TimeGraphOptions & FlowOptions): Paired<TimeGraph>;
        AddBarChart(options?: BarChartOptions & FlowOptions): Paired<BarChart>;
        AddHistogram(options?: HistogramOptions & FlowOptions): Paired<Histogram>;
        AddDivider(options?: DividerOptions & FlowOptions): Paired<Divider>;
        AddItemSlot(object: ObjTypeProxy | undefined, options?: ItemSlotOptions & FlowOptions): Paired<ItemSlot>;
        AddItemGrid(objects: ReadonlyArray<ItemGridEntry | undefined> | undefined, options?: ItemGridOptions & FlowOptions): Paired<ItemGrid>;
        AddTabs(tabs: ReadonlyArray<TabSpec>, options?: TabsOptions & FlowOptions): Paired<Tabs>;
        AddCollapseButton(text: string, options?: CollapseButtonOptions & FlowOptions): Paired<CollapseButton>;
        AddRadioButton<V = SelectionValue>(choices: ReadonlyArray<SelectionChoice<V>>, options?: RadioButtonOptions<V> & FlowOptions): Paired<RadioButton<V>>;
        AddCheckboxButton<V = SelectionValue>(choices: ReadonlyArray<SelectionChoice<V>>, options?: CheckboxButtonOptions<V> & FlowOptions): Paired<CheckboxButton<V>>;
        AddColourPicker(options?: ColourPickerOptions & FlowOptions): Paired<ColourPicker>;
        AddTextField(options?: TextFieldOptions & FlowOptions): Paired<TextField>;
        AddKeybindField(options?: KeybindFieldOptions & FlowOptions): Paired<KeybindField>;
        AddComboBox(options?: ComboBoxOptions & FlowOptions): Paired<ComboBox>;
        AddList(options?: ListOptions & FlowOptions): Paired<List>;
        AddRibbonButton(spriteID: number, action: RibbonButtonAction | undefined, options?: RibbonButtonOptions & FlowOptions): Paired<RibbonButton>;
        AddSimpleButton(content: string | number, action: SimpleButtonAction | undefined, options?: SimpleButtonOptions & FlowOptions): Paired<SimpleButton>;
        AddSlider(options?: SliderOptions & FlowOptions): Paired<Slider>;
        AddFancyButton(text: string, action: FancyButtonAction | undefined, options?: FancyButtonOptions & FlowOptions): Paired<FancyButton>;
        AddSpriteButton(spriteName: SpriteButtonName, action: SpriteButtonAction | undefined, options?: SpriteButtonOptions & FlowOptions): Paired<SpriteButton>;
    }

    /** @customConstructor prettyui.Panel.new */
    class Panel {
        constructor(parent: Component, options?: PanelOptions, flowManaged?: boolean);
        readonly root: Layer;
        readonly parent: Component;
        readonly interfaceID: number;
        readonly dock: PanelSurface;
        readonly overlay: PanelSurface;
        readonly dockOwner: PanelContent;
        readonly overlayOwner: PanelContent;
        readonly content: Layer;
        readonly overlayContent: Layer;
        readonly width: number;
        readonly height: number;
        readonly contentWidth: number;
        readonly poppedOut: boolean;
        readonly scrollable: boolean;
        SetPoppedOut(poppedOut: boolean, notify?: boolean): void;
        TogglePopout(): void;
        SetPopoutClickthrough(clickthrough: boolean): void;
        SetPopoutBackgroundAlpha(alpha: number): void;
        SetSize(width: number, height: number): void;
        SetScrollable(scrollable: boolean): void;
        ScrollToChild(child: Paired<{ readonly root?: Component }> | undefined, topOffset?: number): void;
        BindFlow(owner: FlowOwner): this;
    }
    interface Panel extends PanelContentMethods, RowBackgroundHost, HasTooltip, Destroyable {}
    namespace Panel {
        function getSize(options?: PanelOptions): Size;
    }
}
