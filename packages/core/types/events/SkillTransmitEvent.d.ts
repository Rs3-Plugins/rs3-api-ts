/** @noSelfInFile */

interface SkillTransmitEvent {
    readonly skill: SkillType;
    readonly oldXP: number;
    readonly newXP: number;
    readonly oldGameplayLevel: number;
    readonly newGameplayLevel: number;
}
