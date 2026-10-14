/** @noSelfInFile */

declare namespace Plugin {
    function HasPermission(permission: PluginPermission): boolean;
    const Name: string;
    const Version: string;
    const RemoteID: number;
    const urls: { readonly [name: string]: PluginURL };
    const resources: { readonly [name: string]: PluginResource };
}
