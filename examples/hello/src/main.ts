import { definePlugin } from "rs3-api-extended";
import * as login from "./modules/login";
import * as xp from "./modules/xp";
import * as storage from "./modules/storage";
import * as drops from "./modules/drops";
import * as stats from "./modules/stats";

definePlugin({
    modules: [login, xp, storage, drops, stats],

    init() {
        print(`${Plugin.Name} ${Plugin.Version} loaded`);
    },

    shutdown() {
        print(`${Plugin.Name} stopped`);
    },
});
