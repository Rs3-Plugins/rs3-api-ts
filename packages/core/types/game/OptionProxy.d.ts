/** @noSelfInFile */

interface OptionProxy {
    readonly setting: number;
    readonly isToggle: boolean;
    readonly isModifiable: boolean;
    readonly hasLabels: boolean;
    readonly min: number;
    readonly max: number;
    readonly minMaxRange: Vector2;
    GetLabel(value: number): string;
    CheckIsValidSetting(value: number): boolean;
    Set(value: number): void;
}
