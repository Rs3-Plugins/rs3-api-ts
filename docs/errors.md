# Messages

Every message `rs3-plugin` prints follows the same shape: one line saying what is wrong, then indented lines saying what to do about it.

```
error: Chat.AddMessage needs the "chatAccess" permission, which plugin.json does not ask for
  called from src\modules\login.ts
  add it to requiredPermissions in plugin.json:

      "requiredPermissions": ["chatAccess"]
```

An **error** stops the build and nothing is written. A **warning** prints and the build carries on, so it is there to tell you something will not behave the way you expect once the plugin is running.

Messages that name one of your files name the TypeScript, not the Lua that came out of it. Dev builds bundle every module into one file, so they leave the filename off rather than pointing at the wrong one.

## plugin.json

Checked before anything is compiled.

| Message | Level | Cause and fix |
| --- | --- | --- |
| `plugin.json is missing` | error | Every plugin needs a `plugin.json` next to its `package.json`. `rs3-plugin init` writes one. |
| `plugin.json is not valid JSON: <detail>` | error | Usually a trailing comma or a missing quote. The detail comes from the JSON parser. |
| `"name" is required and must be a non-empty string` | error | The client identifies the plugin by this name, and it is what `Plugin.Name` returns at runtime. |
| `"version" is required and must be a string such as "1.0.0"` | error | Quote it. `1.0` on its own is a number, not a string. If `package.json` has `"rs3": { "syncVersion": true }` the build fills this in for you. |
| `"dependencies" is required` | error | Write `{}` when the plugin depends on nothing. |
| `"dependencies" must be an object mapping identifiers to mod.io ids` | error | It was something other than an object or a list. |
| `"<field>" is []; the client expects an object, so write {} instead` | warning | An empty list is tolerated here but inconsistent. `{}` is the shape the client reads. |
| `"<field>" is a list of names, which the client no longer accepts` | error | Dependencies are named and given an id: `{ "prettyui": 6398181 }`. |
| `"<field>" must be an object mapping identifiers to mod.io ids` | error | Same shape as above. The id is the number on the plugin's mod.io page. |
| `"<field>.<name>" must be a positive mod.io id` | error | The value was a string, a float or zero. Ids are whole numbers. |
| `"<field>.<name>" is not in the known library list` | warning | Expected for a new or private library. Otherwise refresh with `npm run deps:dump`. |
| `"<field>.<name>" has id <n> but the known library list says <m>` | warning | One of the two is stale. The client resolves dependencies by id, so a wrong id means the dependency is never found. |
| `"<field>" must be a list of permission names` | error | A list of strings, or `[]` for none. A bare string is not enough. |
| `"<field>" lists unknown permission "<name>"` | error | The client refuses to load a plugin asking for a permission it does not know. See [Permissions](#permissions). |
| `"urls" must be an object mapping names to URLs` | error | `{ "api": "https://example.com/" }`. The names are yours to pick and show up as `Plugin.urls`. |
| `"urls.<name>" is not an http or https URL` | error | Absolute URLs only. No relative paths, no other schemes. |
| `"<field>" must be true or false` | error | Applies to `hasSettingsIcon`, `hasRibbonIcon` and `autoEnable`. `"yes"` is a string. |
| `"contactEmailAddress" must be a string` | error | Quote it, or leave the field out. |
| `"autoEnable" is no longer read by the client and can be deleted` | warning | Harmless to leave, but it does nothing. |

## The compiled output

Checked after compiling, against the Lua that was produced.

| Message | Level | Cause and fix |
| --- | --- | --- |
| `nothing in this plugin sets up a tick handler, so the client would load it and never run it` | error | `src/main.ts` never calls `definePlugin` and nothing assigns the `PluginLogic` global. The plugin would install and sit there doing nothing. |
| `<Api> needs the "<permission>" permission, which plugin.json does not ask for` | error | You called something gated. The hint names the files that call it and gives the `requiredPermissions` line to paste, keeping the permissions you already declared. |
| `<Api> can only reach hosts that plugin.json lists under "urls", and it lists none` | warning | `HTTPRequest` is restricted to the hosts you declare, so with none declared every request fails. |
| `needs the TypeScriptToLua helper library for <Helpers>, which a release build does not ship` | error | Something has no direct Lua equivalent. See [Keeping the Lua readable](../README.md#keeping-the-lua-readable). Dev builds allow it, release builds do not. |
| `uses <the os library>, which the plugin sandbox does not provide` | warning | Covers `os`, `io`, `debug`, `load`, `loadstring`, `dofile` and `loadfile`. The call compiles but fails at runtime, and there is no replacement. |

Compiler errors appear here too, prefixed with their TypeScript code, for example `TS2322: Type 'string' is not assignable to type 'number'`. Those come from TypeScript and TypeScriptToLua rather than from these checks.

## rs3-plugin init

| Message | Level | Cause and fix |
| --- | --- | --- |
| `plugin name is required` | error | Pass it as an argument, or drop `--yes` to be asked. |
| `"<name>" must be lowercase letters, digits and dashes, starting with a letter or digit` | error | The name becomes a folder, an npm package name and the plugin id, so it has to satisfy all three. |
| `<name> already exists here and is not empty` | error | Nothing was written. Pick another name or empty that folder first. |
| `--permissions: "<name>" is not a permission the client knows` | error | The hint lists the valid ones. Applies to `--optional-permissions` too. |
| `--deps: "<name>" is not in the known library list` | error | Either a typo, or a library the list has not caught up with. Give its id instead: `--deps <name>=123456`. |
| `--deps: "<entry>" does not end in a mod.io id` | error | The part after `=` has to be the number from the plugin's mod.io page. |
| `"<value>" must be three numbers separated by dots, like 0.1.0` | error | A suffix such as `1.0.0-beta.1` is allowed, `1.2` is not. |
| `--urls: "<value>" is not a valid URL` | error | Each entry is a URL, or `name=url`. Quote the whole argument when it contains spaces. |
| `--urls: "<name>" is not a valid url name (letters, digits, _ and -)` | error | The part before `=` becomes a key in `plugin.json`. |
| `--urls: url name "<name>" is used twice` | error | Two entries claimed the same key. Bare URLs take `api`, `api2` and so on, so an explicit `api=` can collide with one. |
| `--contact-email: "<value>" does not look like an email address` | error | Or leave the flag off, since the field is optional. |

While `init` is asking questions rather than reading flags, a bad answer is reported on one line under the prompt and you are asked again. Nothing is written until every answer is in.

## Running the command

| Message | Level | Cause and fix |
| --- | --- | --- |
| `no tsconfig.json here, so there is no plugin to build` | error | `build` and `dev` run inside a plugin folder. The hint says where it looked. |
| `unknown command "<name>"` | error | Followed by the usage summary. |
| `--client: "<value>" is not a client` | error | `beta` (RuneScape-BETA), `live` (RuneScape) or `all`. A bare `--client` means `all`. |
| `the <client> client is not installed at <path>` | error | An explicit `--client` looks under `%ProgramData%\Jagex`. Install that client, pick the other one, or use `--out <dir>`. Dev builds without `--client` skip missing clients instead. |
| `--client only knows where the client keeps plugins on Windows` | error | On other systems, give the folder with `--out <dir>`. |

## Permissions

Three permissions exist, and each one gates a specific part of the API:

| Permission | Unlocks | Also needs |
| --- | --- | --- |
| `httpAccess` | `HTTPRequest` | the hosts you call, under `urls` |
| `chatAccess` | `Chat.AddMessage` | |
| `trackingAccess` | `Player.GetTrackingID` | |

Declare them under `requiredPermissions` if the plugin cannot work without them, or `optionalPermissions` if it can cope when refused. Optional ones can be revoked while the plugin is running, so check `Plugin.HasPermission` before you rely on one, and subscribe to `Event.OptionalPermissionChanged` to hear about changes.

The list lives in [`packages/core/data/permissions.json`](../packages/core/data/permissions.json), which is also what the build reads to decide whether a call is allowed.
