import { definePlugin } from "rs3-api-extended";
import * as window from "./modules/window";

definePlugin({
    modules: [window],

    init() {
        print(`${Plugin.Name} ${Plugin.Version} loaded with PrettyUI ${prettyui.version}`);
    },
});
