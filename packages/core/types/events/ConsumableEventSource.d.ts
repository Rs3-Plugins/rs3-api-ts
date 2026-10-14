/** @noSelfInFile */

/** @noSelf */
interface ConsumableEventSource<T> {
    Subscribe(id: string, handler: (event: T) => boolean | void): void;
    Unsubscribe(id: string): void;
}
