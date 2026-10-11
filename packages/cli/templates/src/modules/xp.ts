import { on } from "rs3-api-extended";

let unsubscribe = () => {};

export function init() {
    unsubscribe = on(Event.SkillTransmit, (e) => {
        const gained = e.newXP - e.oldXP;
        if (gained > 0) {
            print(`[${Plugin.Name}] +${gained} xp (level ${e.newGameplayLevel})`);
        }
    });
}

export function shutdown() {
    unsubscribe();
}
