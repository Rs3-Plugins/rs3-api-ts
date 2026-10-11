/** @noSelfInFile */

/** @noSelf */
interface ConsumableEventSource<T> {
    Subscribe(handler: (event: T) => boolean | void): void;
    Unsubscribe(handler: (event: T) => boolean | void): void;
}
