import { on } from "rs3-api-extended";

let settings: prettyui.Window | undefined;
let status: prettyui.Panel | undefined;
let opened = false;
let ticks = 0;

export function init() {
    on(Event.GameStateChanged, onGameState);
}

export function tick() {
    ticks++;
    if (!opened) {
        open();
    }
}

export function shutdown() {
    opened = false;
    const win = settings;
    const panel = status;
    settings = undefined;
    status = undefined;
    if (win !== undefined) {
        pcall(() => win.Destroy());
    }
    if (panel !== undefined) {
        pcall(() => panel.Destroy());
    }
    if (win !== undefined || panel !== undefined) {
        print(`${Plugin.Name} destroyed its window and panel`);
        announce(`${Plugin.Name} closed its window`);
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
        print(`${Plugin.Name}: building the window failed: ${tostring(err)}`);
        shutdown();
        opened = true;
        return;
    }
    print(`${Plugin.Name} ${Plugin.Version} opened its window, on PrettyUI ${prettyui.version}`);
    announce(`${Plugin.Name} ${Plugin.Version} opened its window, on PrettyUI ${prettyui.version}`);
}

function announce(message: string) {
    if (Plugin.HasPermission(PluginPermissions.chatAccess)) {
        pcall(Chat.AddMessage, ChatType.GENERAL, message);
    }
}

function build(parent: Component) {
    settings = buildSettings(parent);
    status = buildStatus(parent);
}

function onGameState(event: GameStateChangedEvent) {
    if (event.newState !== GameState.GAME) {
        shutdown();
    }
}

function buildSettings(parent: Component): prettyui.Window {
    settings = new prettyui.Window(parent, {
        title: "PrettyUI example",
        width: 420,
        height: 360,
        resizable: true,
        onClose: (w) => print(`${w.title} closed`),
    });
    const win = settings;

    win.AddTitle("GENERAL");
    win.AddText("Everything below is laid out by the window's flow layout.");

    const name = win.AddTextField({
        placeholder: "Display name",
        onSubmit: (_field, content) => print(`name: ${content}`),
    });

    win.AddCheckboxButton(
        [
            { text: "Show timers", value: "timers", selected: true },
            { text: "Play sounds", value: "sounds" },
        ],
        {
            onChange: (_control, values, value, selected) => {
                print(`${value} is now ${selected}; ${values.length} selected`);
            },
        },
    );

    const mode = win.AddRadioButton(["Compact", "Comfortable"], {
        inline: true,
        selectedValue: "Compact",
        onChange: (_control, value) => print(`mode: ${value}`),
    });

    win.AddSlider({
        min: 0,
        max: 100,
        step: 5,
        value: 50,
        onChange: (_slider, value) => print(`opacity ${value}%`),
    });

    win.AddComboBox({
        entries: [
            { label: "Attack", id: 1 },
            { label: "Strength", id: 2 },
            { label: "Defence", id: 3 },
        ],
        selectedID: 1,
        onChange: (_box, entryID, label) => print(`${label} (${entryID})`),
    });

    const section = win.AddCollapseButton("Advanced", { expanded: false });
    section.AddText("Keybind to toggle the status panel:");
    section.AddKeybindField({
        value: [GameKey.CONTROL, GameKey.F1],
        onChange: (_field, value) => print(prettyui.KeybindField.FormatValue(value)),
    });

    win.AddDivider();

    win.AddFancyButton("Save", () => {
        print(`saving ${name.GetText()} in ${mode.GetSelectedValue()} mode`);
        win.Close();
    }, { variant: "positive" });

    win.AddFancyButton("Reset", () => {
        new prettyui.Confirm(parent, {
            body: "Reset every setting to its default?",
            onConfirm: () => {
                name.SetText("");
                mode.SetSelectedValue("Compact");
            },
        });
    }, { inline: true, variant: "negative" });

    return win;
}

function buildStatus(parent: Component): prettyui.Panel {
    status = new prettyui.Panel(parent, {
        x: 20,
        y: 120,
        width: 260,
        height: 140,
        popout: true,
        backgroundAlpha: 0.8,
    });
    const panel = status;
    panel.AddTitle("STATUS");
    const line = panel.AddText("Waiting for the first tick");
    panel.AddSimpleButton("Refresh", (_button) => {
        line.content = `Updated at tick ${ticks}`;
    });
    return panel;
}
