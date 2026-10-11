/** @noSelfInFile */

interface KeyUpDownEvent {
    readonly systemKey: SystemKey;
    readonly gameKey: GameKey;
    readonly modifiers: number;
    readonly isRepeat: boolean;
}
