/** @noSelfInFile */

/** @noSelf */
interface EventSource<T> {
    Subscribe(id: string, handler: (event: T) => void): void;
    Unsubscribe(id: string): void;
}
