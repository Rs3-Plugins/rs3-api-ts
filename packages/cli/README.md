# rs3-api-ts

The `rs3-plugin` command: scaffold, build and check RuneScape 3 plugins written in TypeScript.

```sh
rs3-plugin init my-plugin
cd my-plugin
npm install
npm run build
```

`build` compiles `src/` to a `dist/` folder of plain Lua, copies in your `plugin.json` and the `rs3-api-extended` runtime, and validates the result before letting it through: permissions against the APIs you actually call, the manifest against what the client accepts, and the output against the plugin sandbox.

| Command | What it does |
| --- | --- |
| `rs3-plugin init [name]` | Scaffold a project. Prompts for anything not given as a flag. |
| `rs3-plugin build` | Release build: one readable Lua file per source file. |
| `rs3-plugin build --dev` | The same build, installed into every client's `dev_plugins/`. |
| `rs3-plugin dev` | Dev build on every change, installed the same way. |
| `--out <dir>` | Copy the finished plugin to `<dir>/<plugin name>/`. |
| `--client [beta\|live\|all]` | Copy it into that client's `dev_plugins/` folder (`%ProgramData%\Jagex\RuneScape-BETA` or `RuneScape`). Bare `--client` means `all`. |

Run `rs3-plugin --help` for the full flag list.

Setup, project layout and the rest of the documentation live in the [repository README](https://github.com/Rs3-Plugins/rs3-api-ts#readme).

## License

[MIT](https://github.com/Rs3-Plugins/rs3-api-ts/blob/main/LICENSE)
