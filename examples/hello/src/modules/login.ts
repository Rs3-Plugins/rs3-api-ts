import { on } from "rs3-api-extended";

export function init() {
    on(Event.GameStateChanged, onGameState);
}

function onGameState(event: GameStateChangedEvent) {
    if (event.newState === GameState.GAME) {
        print(`${Plugin.Name} saw the game load`);
    }
}
