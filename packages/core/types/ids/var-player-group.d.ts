/// <reference path="../config/AssetID.d.ts" />

declare namespace id {
    type VarPlayerGroupName =
        | "GROUP_LOOTSHARE"
        | "GROUP_TYPE"
        | "GROUP_WANTS_MEMBERS";

    type VarPlayerGroupIds = { readonly [N in VarPlayerGroupName]: AssetID<"VarPlayerGroup"> };

    interface VarPlayerGroup extends VarPlayerGroupIds {}
}
