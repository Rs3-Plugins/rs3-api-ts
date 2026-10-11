import { on } from "rs3-api-extended";

export function init() {
    on(Event.SkillTransmit, onSkillTransmit);
}

function onSkillTransmit(event: SkillTransmitEvent) {
    const gained = event.newXP - event.oldXP;
    if (gained <= 0) {
        return;
    }

    print(`skill ${event.skill}: +${gained} xp, ${event.newXP} total`);

    if (event.newGameplayLevel > event.oldGameplayLevel) {
        print(`skill ${event.skill} is now level ${event.newGameplayLevel}`);
    }
}
