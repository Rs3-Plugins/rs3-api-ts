# rs3-api-extended

Custom helpers for RuneScape 3 plugins. Not part of Jagex's API.

Everything in this package was written for this project. None of it exists in the game client, and none of it is something you can call from a plain Lua plugin. It compiles to Lua and ships inside your plugin under `lua_modules/rs3-api-extended/`. For the client's own API, which this builds on, see `rs3-api-core`.

```ts
import { definePlugin, on, vars } from "rs3-api-extended";
```

## definePlugin

Wires the lifecycle globals the client looks for and runs your modules.

```ts
definePlugin({
    modules: [login, overlay],
});
```

A module is any object with optional `init`, `tick`, `draw` and `shutdown` functions, which in practice means a file of exported functions imported with `import * as`. `definePlugin` assigns `PluginLogic` and `PluginShutdown`, adds `PluginDraw` only if something actually draws, and calls each hook through `pcall` so one module throwing does not stop the others. Errors print once per distinct message, prefixed with the plugin's name from `plugin.json`. Pass `name` to override that prefix, or `onError` to handle failures yourself.

| Option | Default | What it does |
| --- | --- | --- |
| `modules` | `[]` | Objects whose `init`, `tick`, `draw` and `shutdown` get called. |
| `autoUnsubscribe` | `true` | Detach anything still subscribed through `on` once shutdown has run. |
| `name` | `Plugin.Name` | Prefix on error messages. |
| `onError` | prints once per message | Called with each hook failure instead. |

## autoUnsubscribe

On shutdown, after every module's own `shutdown` has run, any subscription made through `on` and not already detached is detached for you. It is on by default, so a plugin that only ever subscribes in `init` needs no `shutdown` at all:

```ts
import { on } from "rs3-api-extended";

export function init() {
    on(Event.GameStateChanged, onGameState);
}

function onGameState(event: GameStateChangedEvent) {
    if (event.newState === GameState.GAME) {
        Chat.AddMessage(ChatType.GENERAL, "This is a test");
    }
}
```

This only covers `on`. A handler attached with `Event.X.Subscribe(handler)` directly is invisible to it, because nothing recorded the pair, so those stay yours to unsubscribe in `shutdown`. Mixing the two is fine: each `on` subscription is forgotten as soon as its unsubscribe runs, so nothing gets detached twice.

`unsubscribeAll()` is exported if you want to drop every `on` subscription at some other moment, and `autoUnsubscribe: false` turns the shutdown sweep off entirely.

## on

Subscribes to an event. The subscription is live as soon as the call returns, and `definePlugin` will clean it up at shutdown, so most of the time you can ignore the return value.

What it returns is the matching unsubscribe, for when you want to detach before shutdown:

```ts
let stopListening = () => {};

export function init() {
    stopListening = on(Event.SkillTransmit, onSkillTransmit);
}

function onSkillTransmit(event: SkillTransmitEvent) {
    if (event.newGameplayLevel === 99) {
        stopListening();
    }
}
```

Calling it twice is harmless, and so is letting shutdown collect it instead.

## vars

The client's `var` table, under a name TypeScript allows, since `var` is a reserved word.

```ts
const lifepoints = vars.VarPlayer.FromID(13379).value;
```

## Adding a helper

Worth adding if more than one plugin would use it. Keep it to functions and tables: no classes, no array helper methods, nothing that drags in TypeScriptToLua's runtime, because release builds reject output that references it. Put the source in `src/`, export it from `index.ts`, and the build type-checks it against the core declarations.

## License

[MIT](https://github.com/Rs3-Plugins/rs3-api-ts/blob/main/LICENSE)
