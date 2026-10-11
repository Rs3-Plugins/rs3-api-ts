const INTERVAL_TICKS = 500;

let nextReport = 0;

export function tick(now: number) {
    if (now < nextReport || !Player.IsAvailable()) {
        return;
    }
    nextReport = now + INTERVAL_TICKS;

    const combat = Player.GetCombatLevel();
    const hitpoints = Player.GetLevelGameplay(SkillType.HITPOINTS);
    const members = World.IsMembers() ? "members" : "free";

    print(`combat ${combat}, hitpoints ${hitpoints}, ${members}, ${World.GetPing()}ms`);
}
