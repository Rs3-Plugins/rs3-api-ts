/** @noSelfInFile */

declare namespace prettyui {
    interface TimeGraphUpdate {
        metric: string;
        value: number;
    }

    /** @noSelf */
    interface TimeGraphEventChannel {
        Subscribe(callback: (this: void, update: TimeGraphUpdate) => void): boolean;
        Unsubscribe(callback: (this: void, update: TimeGraphUpdate) => void): boolean;
        Publish(payload: TimeGraphUpdate): LuaMultiReturn<[boolean, string | undefined]>;
    }

    interface TimeGraphEventBus {
        readonly Update: TimeGraphEventChannel;
    }

    interface TimeGraphMetric {
        id: string;
        label?: string;
        spriteID?: number;
        rgba?: Colour;
    }

    interface TimeGraphOptions extends PositionOptions, SizeOptions {
        metric: TimeGraphMetric;
        interval?: number;
        capacity?: number;
        zoom?: number;
        bus?: TimeGraphEventBus;
        zoomable?: boolean;
        onZoom?: (this: void, graph: TimeGraph, zoom: number) => void;
        width?: number;
        height?: number;
        visible?: boolean;
    }

    interface TimeGraphBucket {
        value: number;
        startSeconds: number;
        endSeconds: number;
        complete: boolean;
    }

    interface TimeGraphSnapshot {
        metric: string;
        interval: number;
        capacity: number;
        total: number;
        elapsedSeconds: number;
        buckets: TimeGraphBucket[];
    }

    /** @customConstructor prettyui.TimeGraph.new */
    class TimeGraph {
        constructor(parent: Component, options: TimeGraphOptions);
        readonly root: Layer;
        readonly interfaceID: number;
        readonly bus: TimeGraphEventBus;
        readonly label: string;
        SetZoom(zoom: number, notify?: boolean): boolean;
        GetZoom(): number;
        ZoomIn(): boolean;
        ZoomOut(): boolean;
        GetSnapshot(): TimeGraphSnapshot;
        Reset(): boolean;
        SetVisible(visible: boolean): boolean;
        SetSize(width: number, height: number): boolean;
        readonly tooltip: Tooltip | undefined;
    }
    interface TimeGraph extends Destroyable {}
    namespace TimeGraph {
        function CreateEventBus(): TimeGraphEventBus;
        function Shutdown(): void;
        function getSize(options?: TimeGraphOptions): Size;
    }

    interface BarChartRow {
        id: string;
        label: string;
        value: number;
        rgba?: Colour;
    }

    interface ChartOptions extends PositionOptions, SizeOptions {
        label?: string;
        rgba?: Colour;
        width?: number;
        height?: number;
        visible?: boolean;
    }

    interface BarChartOptions extends ChartOptions {
        data?: ReadonlyArray<BarChartRow>;
        orientation?: "horizontal" | "vertical";
    }

    interface BarChartSnapshot {
        label: string;
        data: BarChartRow[];
    }

    /** @customConstructor prettyui.BarChart.new */
    class BarChart {
        constructor(parent: Component, options?: BarChartOptions);
        readonly root: Layer;
        readonly interfaceID: number;
        readonly label: string;
        SetData(rows: ReadonlyArray<BarChartRow>): boolean;
        GetSnapshot(): BarChartSnapshot;
        Reset(): boolean;
        SetVisible(visible: boolean): boolean;
        SetSize(width: number, height: number): boolean;
    }
    interface BarChart extends Destroyable {}
    namespace BarChart {
        function Shutdown(): void;
        function getSize(options?: ChartOptions): Size;
    }

    interface HistogramBin {
        lower: number;
        upper: number;
        count: number;
    }

    interface HistogramOptions extends ChartOptions {
        samples?: ReadonlyArray<number>;
        binWidth?: number;
        origin?: number;
    }

    interface HistogramSnapshot {
        label: string;
        binWidth: number;
        origin: number;
        sampleCount: number;
        bins: HistogramBin[];
    }

    /** @customConstructor prettyui.Histogram.new */
    class Histogram {
        constructor(parent: Component, options?: HistogramOptions);
        readonly root: Layer;
        readonly interfaceID: number;
        readonly label: string;
        readonly binWidth: number;
        readonly origin: number;
        readonly sampleCount: number;
        SetSamples(samples: ReadonlyArray<number>): boolean;
        SetBins(bins: ReadonlyArray<HistogramBin>): boolean;
        GetSnapshot(): HistogramSnapshot;
        Reset(): boolean;
        SetVisible(visible: boolean): boolean;
        SetSize(width: number, height: number): boolean;
    }
    interface Histogram extends Destroyable {}
    namespace Histogram {
        function Shutdown(): void;
        function getSize(options?: ChartOptions): Size;
    }
}
