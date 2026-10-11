# rs3-api-ts

Write RuneScape 3 plugins in TypeScript and compile them to Lua.

The game client loads plugins as Lua 5.4. You write TypeScript instead, so you get type checking and editor completion across the whole plugin API, and the build step turns `src/` into a `dist/` folder of plain Lua that you can read, review and hand to the client as-is.

## What's in here

Three packages:

- **rs3-api-core** declares the plugin API that Jagex ships. Types only, so nothing from it ends up inside your plugin.
- **rs3-api-extended** holds helpers written on top of that API. This one does ship with your plugin, as Lua.
- **rs3-api-ts** is the `rs3-plugin` command, which scaffolds a project, compiles it and checks the result.

A plugin depends on all three. `rs3-plugin init` writes that for you.

## Setup

You need Node 20 or newer. Create a plugin anywhere on disk:

```sh
npx rs3-plugin init my-plugin
cd my-plugin
npm install
npm run build
```

`init` writes all three packages into the new project's `package.json`, so nothing has to be installed globally. `npm install -g rs3-api-ts` puts `rs3-plugin` on your PATH if you prefer that.

That builds the packages, runs the tests, and links all three globally. `init` then points new plugins at the checkout with `file:` paths, so your changes show up on the plugin's next build. `npm run unpublish:local` removes the links again.

`init` asks for a name, the permissions you need, any library plugins you depend on, and a version. Permissions and dependencies are checkbox lists: arrow keys move, space toggles, enter confirms.

Every answer also has a flag, and `--yes` takes the defaults for whatever you leave out:

```sh
rs3-plugin init my-plugin --yes --permissions chatAccess
rs3-plugin init my-plugin --yes --permissions httpAccess --urls https://api.example.com/
rs3-plugin init my-plugin --yes --deps prettyui --plugin-version 1.0.0
```

## The build output

`npm run build` writes a complete plugin folder to `dist/`: `main.lua`, one Lua file per source file, your `plugin.json`, and the `rs3-api-extended` runtime under `lua_modules/`. Nothing else is needed at runtime.

Point the client at that folder, or let the build copy it for you:

```sh
npm run dev -- --out "C:\path\to\your\plugins"
```

`dev` rebuilds on every save and copies the result to `<plugins>/<plugin name>/`. It also builds in dev mode, which bundles everything into one `main.lua` and keeps source maps, so a runtime error points at the TypeScript line rather than the generated Lua. Release builds skip the maps and emit one file per module.

## Writing a plugin

`src/main.ts` declares the plugin and lists its modules:

```ts
import { definePlugin } from "rs3-api-extended";
import * as login from "./modules/login";
import * as xp from "./modules/xp";

definePlugin({
    modules: [login, xp],
});
```

[`examples/hello`](examples/hello) is a working plugin built from five of these modules: a chat message on login, printed XP gains and level-ups, a session counter kept in `PersistentDB`, valuable ground items announced by name and price, and a periodic stat line driven off `tick`.

## Commands

| Command | What it does |
| --- | --- |
| `rs3-plugin init [name]` | Scaffold `./<name>`. Prompts for anything not given as a flag. |
| `rs3-plugin build` | Release build: one readable Lua file per source file. |
| `rs3-plugin build --dev` | Dev build: single bundle with source maps. |
| `rs3-plugin dev` | Dev build on every change. |
| `--out <dir>` | Copy the finished plugin to `<dir>/<plugin name>/`. |

## Permissions

Anything that reaches outside the plugin needs a permission listed in `plugin.json`:

- `httpAccess` for `HTTPRequest`, and only against hosts you list under `urls`
- `chatAccess` for `Chat.AddMessage`
- `trackingAccess` for `Player.GetTrackingID`

`init` offers these as a checkbox list. The build knows which API each one unlocks, so calling a gated API without declaring its permission fails the build instead of failing silently in game. They live in [`packages/core/data/permissions.json`](packages/core/data/permissions.json), and [docs/errors.md](docs/errors.md#permissions) covers optional permissions and what to check at runtime.

## Depending on other plugins

Plugins can depend on library plugins published on mod.io under the tag [Library for other Plugins](https://mod.io/g/runescape/m?tags=Library+for+other+Plugins). `init` offers that list, and writes the picks to `plugin.json` keyed by slug and mod.io id:

```json
"requiredDependencies": {
  "prettyui": 6398181
}
```

On the command line, `--deps prettyui` takes a listed library, `--deps mything=123456` takes any other mod.io id, and `--optional-deps` fills the optional set.

The known list is [`packages/cli/data/modio-libraries.json`](packages/cli/data/modio-libraries.json), refreshed from mod.io with `npm run deps:dump`. A GitHub Actions workflow runs that weekly and commits any change. Because the list can lag mod.io, a dependency that is missing from it only produces a warning.

## What the build checks

Errors stop the build, warnings print and carry on. Every message comes with indented lines telling you how to fix it, and [docs/errors.md](docs/errors.md) lists all of them.

- `plugin.json` has a name, a version and `dependencies`; permissions are ones the client knows; URLs are valid; dependency fields are objects of name to mod.io id; the icon flags are booleans.
- Something sets up a tick handler, so the plugin will actually run once installed.
- Gated APIs have their permission declared.
- Release output contains no TypeScriptToLua helper library. If it does, something in your code has no clean Lua equivalent, and the error names it.
- References to `os`, `io`, `debug`, `load`, `loadstring`, `dofile` and `loadfile` warn, since the plugin sandbox does not provide them.

## Keeping the Lua readable

Most TypeScript compiles to Lua that reads like it was written by hand. A few habits keep it that way:

- Loop with `for (const x of list)` and `for (const k in table)` rather than `.forEach`, `.map` or `.filter`.
- Use plain objects and module files rather than classes.
- Go easy on `?.` and `??`; each one expands into a temporary and an `if`.
- Never write a colon call yourself. The declarations already record which calls take `self`, so `Event.X.Subscribe(fn)` emits a dot and `request:AddHeader(...)` emits a colon. Write ordinary TypeScript and you get the right one.
- `var` is a reserved word in TypeScript, so import `vars` from `rs3-api-extended` to reach `var.VarPlayer.FromID(...)`.


## License

[MIT](LICENSE)
