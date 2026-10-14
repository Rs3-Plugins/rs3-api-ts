/** @noSelfInFile */

/** @noSelf */
export interface Module {
    init?(): void;
    tick?(now: number): void;
    draw?(deltaSecs: number): void;
    shutdown?(): void;
}

/** @noSelf */
export interface PluginOptions extends Module {
    name?: string;
    modules?: Module[];
    autoUnsubscribe?: boolean;
    onError?(message: string): void;
}

export type Unsubscribe = () => void;

export type Handler<T> = (event: T) => boolean | void;

/** @noSelf */
export interface Subscribable<T> {
    Subscribe(id: string, handler: Handler<T>): void;
    Unsubscribe(id: string): void;
}

type Hook = ((this: void, ...args: any[]) => void) | undefined;

interface Tracked {
    detach: Unsubscribe | undefined;
}

declare const _G: { readonly var: VarApi };

export const vars: VarApi = _G.var;

let tracked: Tracked[] = [];
let nextID = 0;

/** @noSelf */
export function on<T>(source: Subscribable<T>, handler: Handler<T>, id?: string): Unsubscribe {
    nextID = nextID + 1;
    const key = id !== undefined ? id : `rs3api_${nextID}`;
    source.Subscribe(key, handler);

    const entry: Tracked = {
        detach: () => {
            pcall(() => source.Unsubscribe(key));
        },
    };
    tracked[tracked.length] = entry;

    return () => {
        const detach = entry.detach;
        if (detach !== undefined) {
            entry.detach = undefined;
            detach();
        }
    };
}

/** @noSelf */
export function unsubscribeAll(): void {
    const pending = tracked;
    tracked = [];
    for (const entry of pending) {
        const detach = entry.detach;
        if (detach !== undefined) {
            entry.detach = undefined;
            detach();
        }
    }
}

/** @noSelf */
export function definePlugin(options: PluginOptions): void {
    const name = options.name || Plugin.Name || "plugin";
    const modules = options.modules || [];
    const autoUnsubscribe = options.autoUnsubscribe !== false;
    let lastError: string | undefined;

    const report = (message: string) => {
        if (options.onError !== undefined) {
            options.onError(message);
        } else if (message !== lastError) {
            lastError = message;
            print(`[${name}] ${message}`);
        }
    };

    const guard = (fn: Hook, arg?: unknown) => {
        if (fn === undefined) {
            return;
        }
        const [ok, err] = pcall(fn, arg);
        if (!ok) {
            report(tostring(err));
        }
    };

    PluginLogic = (event) => {
        const now = event.logicTick;
        for (const m of modules) {
            guard(m.tick, now);
        }
        guard(options.tick, now);
    };

    let hasDraw = options.draw !== undefined;
    for (const m of modules) {
        if (m.draw !== undefined) {
            hasDraw = true;
        }
    }
    if (hasDraw) {
        PluginDraw = (event) => {
            const delta = event.timeDeltaSecs;
            for (const m of modules) {
                guard(m.draw, delta);
            }
            guard(options.draw, delta);
        };
    }

    PluginShutdown = () => {
        if (autoUnsubscribe) {
            guard(unsubscribeAll);
        }
        guard(options.shutdown);
        for (const m of modules) {
            guard(m.shutdown);
        }
    };

    for (const m of modules) {
        guard(m.init);
    }
    guard(options.init);
}
