/** @noSelfInFile */

interface InterfaceManager {
    GetInterface(interfaceId: number): Interface | undefined;
    GetComponent(combinedId: number): Component | undefined;
    GetComponent(interfaceId: number, componentId: number): Component | undefined;
}
