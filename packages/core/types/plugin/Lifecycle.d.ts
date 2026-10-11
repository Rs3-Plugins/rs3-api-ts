/** @noSelfInFile */

declare var PluginLogic: ((event: MainLogicEvent) => void) | undefined;
declare var PluginDraw: ((event: MainDrawEvent) => void) | undefined;
declare var PluginShutdown: (() => void) | undefined;
declare var PluginOptionalDependencyChanged: ((event: OptionalDependencyChangedEvent) => void) | undefined;
