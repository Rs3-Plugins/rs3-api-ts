# Notice

## PrettyUI

These declarations describe the public API of **PrettyUI**, a UI library plugin for RuneScape 3 written by J3 (`rsnJ3` on mod.io, contact `plugins@j3.gg`).

- Source: https://github.com/J3sven/prettyui
- Documentation: https://prettyui.j3.gg/
- mod.io: https://mod.io/g/runescape/m/prettyui (id 6398181)

PrettyUI is not part of this package. The package contains TypeScript type declarations only, written by reading PrettyUI's Lua source; it ships no PrettyUI code, sprites or resources, and installing it does not install PrettyUI. PrettyUI itself is distributed by its author through mod.io, and the game client loads it when a plugin lists it as a dependency.

PrettyUI's copyright belongs to its author. At the time of writing (PrettyUI 1.1.0, October 2026) the repository and the mod.io listing publish no licence file, so no licence for PrettyUI is granted or implied by this package; use PrettyUI on whatever terms its author offers. The `npm run prettyui:check` script reports if a licence file appears in the PrettyUI repository so this notice can be updated.

Component names, option names and method names reproduced here are used to describe the interface so that plugins written in TypeScript can call the library correctly.

## This package

The declarations themselves are released under the MIT licence of the rs3-api-ts project; see [LICENSE](LICENSE).
