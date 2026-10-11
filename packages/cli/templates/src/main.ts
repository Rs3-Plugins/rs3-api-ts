import { definePlugin } from "rs3-api-extended";
import * as xp from "./modules/xp";

definePlugin({
    modules: [xp],
    init() {
        print(`[${Plugin.Name}] loaded`);
    },
});
