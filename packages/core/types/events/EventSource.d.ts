/** @noSelfInFile */

/** @noSelf */
interface EventSource<T> {
    Subscribe(handler: (event: T) => void): void;
    Unsubscribe(handler: (event: T) => void): void;
}
