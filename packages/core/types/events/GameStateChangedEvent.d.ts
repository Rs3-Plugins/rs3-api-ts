/** @noSelfInFile */

interface GameStateChangedEvent {
    readonly oldState: GameState;
    readonly newState: GameState;
}
