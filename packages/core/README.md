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

## License

[MIT](https://github.com/Rs3-Plugins/rs3-api-ts/blob/main/LICENSE)
