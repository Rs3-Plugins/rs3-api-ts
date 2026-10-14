import { on } from "rs3-api-extended";

interface Gameval {
    readonly label: string;
    readonly value: number;
}

const LOOKUPS: ReadonlyArray<Gameval> = [
    { label: "id.Achievement.CHEEVO_ATFAL_ELITE_COOK_ROCKTAIL", value: id.Achievement.CHEEVO_ATFAL_ELITE_COOK_ROCKTAIL },
    { label: "id.BaseAnimSet.HUMAN_BASIC_UNARMED", value: id.BaseAnimSet.HUMAN_BASIC_UNARMED },
    { label: "id.Category.CATABLEPON", value: id.Category.CATABLEPON },
    { label: "id.Component.TOPLEVEL_V2__GAME_AREA", value: id.Component.TOPLEVEL_V2__GAME_AREA },
    { label: "id.Cursor.CURSOR_DEFAULT", value: id.Cursor.CURSOR_DEFAULT },
    { label: "id.DBRow.ARCH_EXCAVATION_ACROPOLIS_DEBRIS", value: id.DBRow.ARCH_EXCAVATION_ACROPOLIS_DEBRIS },
    { label: "id.DBTable.ARCH_EXCAVATION", value: id.DBTable.ARCH_EXCAVATION },
    { label: "id.Enum.STAT2ICON", value: id.Enum.STAT2ICON },
    { label: "id.Font.B12_FULL", value: id.Font.B12_FULL },
    { label: "id.Headbar.HEALTH_DEFAULT", value: id.Headbar.HEALTH_DEFAULT },
    { label: "id.Hitmark.BLUE_CRITMARK", value: id.Hitmark.BLUE_CRITMARK },
    { label: "id.Interface.TOPLEVEL_V2", value: id.Interface.TOPLEVEL_V2 },
    { label: "id.Inv.BANK", value: id.Inv.BANK },
    { label: "id.Loc.TREE", value: id.Loc.TREE },
    { label: "id.MapElement.BANKVAULT", value: id.MapElement.BANKVAULT },
    { label: "id.Material.ACID_WATERFALL", value: id.Material.ACID_WATERFALL },
    { label: "id.Model.TREE_HOLLOW", value: id.Model.TREE_HOLLOW },
    { label: "id.Music.ESCAPE", value: id.Music.ESCAPE },
    { label: "id.NPC.GOBLIN", value: id.NPC.GOBLIN },
    { label: "id.Obj.COINS", value: id.Obj.COINS },
    { label: "id.Param.PARAM_NULL", value: id.Param.PARAM_NULL },
    { label: "id.Quest.COOKS_ASSISTANT", value: id.Quest.COOKS_ASSISTANT },
    { label: "id.Seq.HUMAN_2013_BANKER_IDLE", value: id.Seq.HUMAN_2013_BANKER_IDLE },
    { label: "id.Sound.LEVEL_UP_SPARKLE", value: id.Sound.LEVEL_UP_SPARKLE },
    { label: "id.Sprite.RS3_CONTEXTUAL_INPUT_ERROR", value: id.Sprite.RS3_CONTEXTUAL_INPUT_ERROR },
    { label: "id.Struct.SKILLCAPE_PERKS_INFO_ATTACK", value: id.Struct.SKILLCAPE_PERKS_INFO_ATTACK },
    { label: "id.StyleSheet.BACKGROUND_DEFAULT", value: id.StyleSheet.BACKGROUND_DEFAULT },
    { label: "id.UIAnim.FADE_QUICK_IN_SLOW_OUT", value: id.UIAnim.FADE_QUICK_IN_SLOW_OUT },
    { label: "id.UIAnimCurve.LINEAR", value: id.UIAnimCurve.LINEAR },
    { label: "id.VarClan.CLANLOG_MEMBERS_CAPPED", value: id.VarClan.CLANLOG_MEMBERS_CAPPED },
    { label: "id.VarClanSetting.CLAN_ADMIN_MES_0_VARCLAN", value: id.VarClanSetting.CLAN_ADMIN_MES_0_VARCLAN },
    { label: "id.VarClient.CHATBOX_FOCUS", value: id.VarClient.CHATBOX_FOCUS },
    { label: "id.VarPlayer.STATS_TARG_01", value: id.VarPlayer.STATS_TARG_01 },
    { label: "id.VarPlayerGroup.GROUP_TYPE", value: id.VarPlayerGroup.GROUP_TYPE },
];

const SPRITES: ReadonlyArray<Gameval> = [
    { label: "RS3_CONTEXTUAL_INPUT_ACCEPT", value: id.Sprite.RS3_CONTEXTUAL_INPUT_ACCEPT },
    { label: "RS3_CONTEXTUAL_INPUT_ERROR", value: id.Sprite.RS3_CONTEXTUAL_INPUT_ERROR },
    { label: "RS3_CONTEXTUAL_INPUT_WARNING", value: id.Sprite.RS3_CONTEXTUAL_INPUT_WARNING },
    { label: "RS3_CONTEXTUAL_INPUT_GREEN_CHECK_MARK", value: id.Sprite.RS3_CONTEXTUAL_INPUT_GREEN_CHECK_MARK },
];

const OBJS: ReadonlyArray<Gameval> = [
    { label: "COINS", value: id.Obj.COINS },
    { label: "ABYSSAL_WHIP", value: id.Obj.ABYSSAL_WHIP },
    { label: "DRAGON_SCIMITAR", value: id.Obj.DRAGON_SCIMITAR },
    { label: "BONES", value: id.Obj.BONES },
    { label: "SHARK", value: id.Obj.SHARK },
];

const SHOWN = 10;

let window: prettyui.Window | undefined;
let lines: Text[] = [];
let opened = false;

export function init() {
    on(Event.GameStateChanged, onGameState);
}

export function tick() {
    if (!opened) {
        open();
    }
}

export function shutdown() {
    opened = false;
    const win = window;
    window = undefined;
    lines = [];
    if (win !== undefined) {
        pcall(() => win.Destroy());
        print(`${Plugin.Name} closed the gameval window`);
    }
}

function onGameState(event: GameStateChangedEvent) {
    if (event.newState !== GameState.GAME) {
        shutdown();
    }
}

function open() {
    const gameArea = ui.Interfaces.GetComponent(id.Component.TOPLEVEL_V2__GAME_AREA);
    if (gameArea === undefined) {
        return;
    }
    opened = true;
    const [built, err] = pcall(build, gameArea);
    if (!built) {
        print(`${Plugin.Name}: building the gameval window failed: ${tostring(err)}`);
        shutdown();
        opened = true;
        return;
    }
    print(`${Plugin.Name} resolved ${LOOKUPS.length} gamevals, one from every id lookup`);
}

function shuffled(count: number): Gameval[] {
    const order: number[] = [];
    for (let i = 0; i < LOOKUPS.length; i++) {
        order[i] = i;
    }
    for (let i = LOOKUPS.length - 1; i > 0; i--) {
        const j = math.random(1, i + 1) - 1;
        const held = order[i];
        order[i] = order[j];
        order[j] = held;
    }
    const picked: Gameval[] = [];
    for (let i = 0; i < count && i < order.length; i++) {
        picked[i] = LOOKUPS[order[i]];
    }
    return picked;
}

function objName(value: number): string {
    const proxy = config.Obj.FromID(value);
    return proxy === undefined ? "unresolved" : proxy.name;
}

function reroll() {
    const picked = shuffled(SHOWN);
    for (let i = 0; i < lines.length; i++) {
        const entry = picked[i];
        lines[i].content = entry === undefined ? "" : `${entry.label} = ${entry.value}`;
    }
}

function build(parent: Component) {
    window = new prettyui.Window(parent, {
        title: "Gamevals",
        width: 520,
        height: 460,
        resizable: true,
        onClose: () => shutdown(),
    });
    const win = window;

    win.AddTitle("SPRITES");
    win.AddText("Each of these is drawn from an id.Sprite name, so a wrong id shows nothing.");
    for (const sprite of SPRITES) {
        win.AddSprite(sprite.value, { inline: true, tooltip: { text: `${sprite.label} = ${sprite.value}` } });
    }

    win.AddDivider();
    win.AddTitle("ITEMS");
    win.AddText("id.Obj names resolved through config.Obj, which gives the item its real name back.");
    for (const obj of OBJS) {
        win.AddItemSlot(config.Obj.FromID(obj.value), { inline: true, tooltip: { text: `${obj.label} = ${obj.value} (${objName(obj.value)})` } });
    }

    win.AddDivider();
    win.AddTitle("A RANDOM TEN");
    win.AddText(`Picked from one name per lookup, ${LOOKUPS.length} in all.`);
    lines = [];
    for (let i = 0; i < SHOWN; i++) {
        lines[i] = win.AddText("");
    }
    reroll();

    win.AddDivider();
    win.AddFancyButton("Reroll", () => reroll());
    win.AddFancyButton("Print all", () => {
        for (const entry of LOOKUPS) {
            print(`${entry.label} = ${entry.value}`);
        }
    }, { inline: true });
}
