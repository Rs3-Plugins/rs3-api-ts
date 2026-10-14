# rs3-api-core

TypeScript declarations for the standard Jagex RuneScape 3 plugin API.

Everything in this package describes the API the game client itself provides to plugins: `Event`, `Player`, `World`, `Inventory`, `config`, `HTTPRequest`, `PersistentDB`, `ui` and the rest, along with the enums and the lifecycle entry points. Nothing here is an invention of this project, and nothing here is a wrapper. If you have written a plugin in Lua, these are the same globals you already use, with types attached.

The package is types only. It has no runtime and contributes nothing to your plugin's output. For helpers built on top of this API, see `rs3-api-extended`.

## Use

```json
{ "compilerOptions": { "types": ["rs3-api-core"] } }
```

Projects created by `rs3-plugin init` already extend a config that does this. The declarations bring in the Lua 5.4 standard library types and the TypeScriptToLua language extensions themselves, so there is nothing else to add.

Everything is global, so there are no imports to write:

```ts
Event.SkillTransmit.Subscribe((e) => {
    print(`${e.skill} reached level ${e.newGameplayLevel}`);
});
```

## Conventions

API tables are dot calls and userdata objects are colon calls. The declarations encode which is which, so you write ordinary TypeScript and the compiler emits the right form:

```ts
Event.GameStateChanged.Subscribe(handler);   // Event.GameStateChanged.Subscribe(handler)
PersistentDB.SetInt("key", 1);               // PersistentDB:SetInt("key", 1)
```

Enum members compile to table lookups such as `SkillType.ATTACK`, never to bare numbers, so a plugin keeps working if the underlying values ever move.

The Lua global `var` is a reserved word in TypeScript and cannot be declared. `rs3-api-extended` exports it as `vars`.

## Game ids

The `id` namespace is declared here, one lookup per asset type. All 34 lookups and all of their names are declared, around 765,000 of them, so a name completes and a typo is a compile error:

```ts
const sprite = id.Sprite.RS3_CONTEXTUAL_INPUT_ERROR;
const area = id.Component.TOPLEVEL_V2__GAME_AREA;
```

A name is its gameval name uppercased, exactly as the client stores it. Components read `interface__component`, so `toplevel_v2__game_area` is `TOPLEVEL_V2__GAME_AREA`.

Each lookup also declares its name union and its member map, so you can write code that takes a name rather than a resolved id:

```ts
function show(name: id.SpriteName) {
    return id.Sprite[name];
}
```

A lookup is not a table of ids. `FromID` and `assetTypeID` are its only real members, and a name is resolved in native code when you index it, so there is nothing to iterate; `rs3-plugin build` warns if you try. `FromID` is the inverse, taking a number and giving back a typed id:

```ts
const sprite = id.Sprite.FromID(18695);
```

### Where the names come from

The client keeps the names in its own cache, in archive 67. `scripts/dump-gamevals.js` reads them straight out of it: it asks [the OpenRS2 archive](https://archive.openrs2.org) for the newest beta cache, pulls the 34 groups of archive 67 one at a time, decodes each name table and writes one file per lookup to `types/ids/`. No full cache is downloaded; a group is one request of a few hundred kilobytes.

Only beta caches carry archive 67. OpenRS2's live RuneScape caches hold 67 of the 68 indexes, and the missing one is exactly the one the names live in, so the script skips any cache that answers 404 for archive 67 and falls back to the newest one that has it.

The Sync gamevals workflow follows the game's Monday update: it checks hourly on Monday, Tuesday and Wednesday, and stops for the rest of the week as soon as it has a cache archived in the current ISO week. The next Monday starts a new week and it picks up again. A pull request opens when a new cache turns up, and nothing about it needs a hand: it merges itself once the build is green, production fast-forwards to main, and the Release workflow bumps the patch version and publishes, so `npm update` in a plugin brings the names for the cache the client is loading.

Plenty of weeks bring no new cache at all, which is normal and needs nothing done about it. Those weeks the check simply finds the recorded cache is still the newest and stops there, quietly and without opening anything; it keeps looking through Monday to Wednesday in case one arrives, then waits for the next Monday.

Once a week does bring a cache, the remaining checks cost no network at all: the recorded timestamp is enough to know there is nothing to look for. A check that does reach the network costs a checkout and two requests, because the probe never decodes anything, so dependencies are only installed when there is something to build. While a sync pull request is open and unmerged it is left alone rather than rebuilt on every pass.

The window is deliberately narrow. Of the 31 beta caches OpenRS2 archived in 2026, 15 landed on a Monday, Tuesday or Wednesday and 14 on a Friday, so a cache published later in the week waits until the following Monday. Stopping once the week has a cache also means a second cache in the same week is left for next week. Run the workflow by hand, or `npm run ids:dump`, to pick either up straight away: neither path applies the weekly stop.

`data/gamevals.json` records which cache the current declarations came from: the id, the client build, the per-lookup name counts and the newest beta cache OpenRS2 had at the time.

The layout of the cache and of the name tables follows [zwyz/rs3-cache](https://github.com/zwyz/rs3-cache), which is the reference for this format. Name groups are bzip2 with the four-byte header stripped, which is the one thing Node cannot do on its own and why `seek-bzip` is a dev dependency.

Three name tables have no `id` lookup in the client and are not read: `varbit`, `var_npc` and `var_object`. Names beginning with an underscore are the client's own scratch entries and are left out.

The names are Jagex's game data, read out of the client cache; this package only restates them as TypeScript declarations.

## License

[MIT](https://github.com/Rs3-Plugins/rs3-api-ts/blob/main/LICENSE)
