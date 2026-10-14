# rs3-api-prettyui

TypeScript declarations for [PrettyUI](https://github.com/J3sven/prettyui), the RuneScape 3 UI library plugin by J3 ([docs](https://prettyui.j3.gg/), [mod.io](https://mod.io/g/runescape/m/prettyui)). PrettyUI is J3's work; this package only describes its interface. See [NOTICE.md](NOTICE.md).

PrettyUI is a separate plugin that other plugins depend on. When `plugin.json` lists it, the client loads it first and sets a `prettyui` global in your plugin. This package types that global: every component, its constructor, its options, its callbacks and its methods, written against the library's own Lua source. It is types only and ships nothing into your plugin.

Written against PrettyUI 1.1.0; [`data/source.json`](data/source.json) records the exact commit.

## Use

Depend on the library in `plugin.json` and add the package to `tsconfig.json`:

```json
"requiredDependencies": { "prettyui": 6398181 }
```

```json
{ "compilerOptions": { "types": ["rs3-api-core", "rs3-api-prettyui"] } }
```

`rs3-plugin init my-plugin --deps prettyui` does both. The build refuses to compile a plugin that uses `prettyui` without declaring the dependency, because the global would be nil in game.

```ts
const gameArea = ui.Interfaces.GetComponent(id.Component.TOPLEVEL_V2__GAME_AREA);

const win = new prettyui.Window(gameArea!, {
    title: "Settings",
    width: 420,
    height: 300,
    onClose: (w) => print(`${w.title} closed`),
});

win.AddTitle("GENERAL");
win.AddText("Components stack top to bottom; pass { inline: true } to share a row.");

const name = win.AddTextField({ placeholder: "Display name" });

win.AddSlider({ min: 0, max: 100, value: 50, onChange: (_slider, value) => print(value) });

win.AddFancyButton("Save", () => {
    print(name.GetText());
    win.Close();
}, { variant: "positive" });
```

That compiles to the Lua PrettyUI expects:

```lua
local win = prettyui.Window.new(gameArea, { title = "Settings", ... })
win:AddTitle("GENERAL")
local name = win:AddTextField({ placeholder = "Display name" })
```

`new prettyui.X(...)` becomes `prettyui.X.new(...)`, methods on a component are colon calls, and module-level functions such as `prettyui.KeybindField.FormatValue` are dot calls. Callbacks receive the component first, the way the library calls them.

[`examples/prettyui-window`](../../examples/prettyui-window) is a complete plugin using a window, a panel, a collapse section and most of the controls.

## What is here

| Namespace member | What it is |
| --- | --- |
| `Window`, `SimpleView`, `Panel`, `Tabs` (with `TabPage`), `CollapseButton` | Content hosts. Their `Add…` methods create and lay out children. |
| `Text`, `Divider`, `Sprite`, `Spinner` / `BigSpinner`, `ItemSlot`, `ItemGrid` | Static pieces. |
| `SimpleButton`, `FancyButton`, `SpriteButton`, `RibbonButton` | Buttons. |
| `TextField`, `KeybindField`, `ComboBox`, `List`, `RadioButton`, `CheckboxButton`, `Slider`, `ColourPicker` | Inputs. |
| `TimeGraph`, `BarChart`, `Histogram` | Charts. `TimeGraph.CreateEventBus()` feeds a graph. |
| `Dialog`, `Confirm`, `AchievementPopup`, `AnchoredTooltip`, `Tooltip` | Overlays. |
| `BuffBar`, `RibbonBar` (deprecated by PrettyUI) | Entries in the client's own bars. |
| `Sprites`, `version` | The sprite ids PrettyUI draws with, and the library version. |

Option tables accept both `colour` and `color` spellings where the library does. Everything a `Window` takes, a `Panel` takes too, except `AddPanel`; a panel's children come back as paired proxies with `.dock` and `.overlay` sides.

The host-level flow options (`inline`, `absolute`, `marginTop`, `marginBottom`, `offsetY`, `columnGap`, `rowBackground`, `rowBackgroundGroup`) are typed on every `Add…` call as `FlowOptions`.

## Keeping up with PrettyUI

The package tracks the release on mod.io, which is the one the client loads. A plugin that depends on `^rs3-api-prettyui` gets the matching declarations on its next `npm update`.

### Versioning

This package is the one part of the SDK that does not share the SDK's version. Its major and minor follow PrettyUI's own, and the patch is this project's to spend:

| PrettyUI | rs3-api-prettyui | |
| --- | --- | --- |
| 1.1.0 | 1.1.0 | the declarations for that release |
| 1.1.0 | 1.1.1 | a fix to the declarations, same PrettyUI |
| 1.2.0 | 1.2.0 | PrettyUI moved, so these follow |

So `1.1.x` always means "typed against PrettyUI 1.1", and `npm install rs3-api-prettyui@1.1` asks for exactly that. `rs3-plugin init --deps prettyui` writes the range from the installed package, so the plugin it scaffolds depends on the PrettyUI library and on declarations whose version says which PrettyUI they describe. The sync moves the major and minor when mod.io does; the Release workflow moves the patch.

The exact release the declarations were generated from is in `data/source.json`, down to the mod.io file id and the source commit.

- `npm run prettyui:check` clones the library at the recorded commit and compares it with the declarations in both directions, with nothing mapped by hand. The component list comes from `main.lua`; each component's constructor, methods, module functions, metatable bases, inner classes, installed Add… methods and scroll methods come from its Lua file; the TypeScript side is parsed with the compiler. Parameter counts and names must match, every declared property must be assigned somewhere in the Lua, and nothing may be declared that the Lua does not define. Option tables are checked by following every object-typed parameter through the Lua (calls, copies, aliases, loops, stored entries, string-literal dispatch such as radio versus checkbox) and recording the keys it reads and the callbacks it calls with how many arguments: every key read must be declared, every declared key must be read, and every callback arity must match. It also compares the `Sprites` table keys, the library version and the licence situation. A mismatch in any direction fails the check. `--self-test` additionally breaks copies of the declarations in fourteen ways and confirms each is caught; CI runs that on every push. Pass `--ref main` to check against the latest source and see what changed.

Three kinds of Lua members are documented as library plumbing rather than hidden, so the counts stay exact: `getSize` and `flowOptions` on each component module, `BindFlow` on the components whose height can reflow a host, and the tooltip context functions. Underscore-prefixed Lua members are private and are not declared.
- `npm run prettyui:check --fix` goes one step further and applies every difference to the declaration files: it adds or removes methods, functions, constructors, parameters, option keys, callback signatures and sprite keys, rewrites parameter lists to the Lua's names, scaffolds a new file for a component PrettyUI adds, and deletes declarations for one it removes. It also works out as much of each type as the Lua shows: a number from arithmetic or a numeric helper, a string union from the table a value is used to index, a callback signature from how the library calls the value, a component type from what a function constructs or returns, the base a component inherits from, and the readonly properties a new component's constructor assigns. What is left comes out as `unknown`, so a review can tighten it, but the result always passes the check. The self-test proves every mutation is repaired as well as caught.
- `npm run prettyui:sync` asks mod.io for PrettyUI's newest upload. When it is newer than the recorded one, it finds the commit in PrettyUI's GitHub repository that carries that version, diffs the Lua between the previously recorded commit and the new one (every public function added, removed or re-parameterised, plus the file statistics), records the new release in `data/source.json`, runs the check, applies `--fix` when the check fails, and runs it again. The pull request it opens carries the changelog from mod.io, the Lua diff, the declaration diff and both check results. `--check-only` just reports, and `--diff <from>..<to>` prints the Lua diff between any two commits on its own.
- The **Sync PrettyUI** GitHub Actions workflow runs the sync daily and opens a pull request for a new release, with the changelog and the check result in its description. When the re-check and the self-test pass after the fixer has run and the tests pass, the pull request merges on its own; when a difference could not be applied, the pull request waits for a person. Merging promotes `main` to `production` and runs the Release workflow, which bumps the versions and publishes all four SDK packages to npm.

  The workflow needs an optional `SYNC_TOKEN` secret (a personal access token with contents and pull-request scopes; pull requests opened with the built-in token do not run CI, so without it auto-merge cannot wait for the checks), the existing `NPM_TOKEN`, and "allow auto-merge" enabled in the repository settings.

## Licence and attribution

The declarations are [MIT](https://github.com/Rs3-Plugins/rs3-api-ts/blob/main/LICENSE), like the rest of rs3-api-ts.

PrettyUI itself is copyright its author, J3, and is not included in this package: nothing here is PrettyUI code, and the library is installed by the game client from [mod.io](https://mod.io/g/runescape/m/prettyui), not by npm. PrettyUI's repository currently publishes no licence file, so its terms are whatever its author offers. [NOTICE.md](NOTICE.md) has the full attribution and links.
