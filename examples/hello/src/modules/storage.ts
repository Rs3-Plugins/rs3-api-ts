import { on } from "rs3-api-extended";

const SESSIONS = "sessions";
const LAST_SEEN = "lastSeen";

export function init() {
    on(Event.GameStateChanged, onGameState);
}

function onGameState(event: GameStateChangedEvent) {
    if (event.newState !== GameState.GAME) {
        return;
    }

    const sessions = (PersistentDB.GetInt(SESSIONS) || 0) + 1;
    PersistentDB.SetInt(SESSIONS, sessions);

    const previous = PersistentDB.GetString(LAST_SEEN);
    if (previous !== undefined) {
        print(`welcome back, last seen as ${previous}`);
    }

    const entity = Player.GetEntity();
    if (entity !== undefined) {
        PersistentDB.SetString(LAST_SEEN, entity.displayName);
    }

    print(`session ${sessions}`);
}
