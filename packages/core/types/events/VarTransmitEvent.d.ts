/** @noSelfInFile */

interface VarTransmitEvent {
    readonly var: VarProxy;
    readonly oldValue: number | string;
    readonly newValue: number | string;
    readonly timestamp: number;
}
