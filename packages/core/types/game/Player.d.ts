/** @noSelfInFile */

declare namespace Player {
    function IsAvailable(): boolean;
    function GetEntity(): PlayerEntityProxy | undefined;
    function GetLevelGameplay(skill: SkillType): number;
    function GetLevelUncapped(skill: SkillType): number;
    function GetLevelCapped(skill: SkillType): number;
    function GetXPUncapped(skill: SkillType): number;
    function GetXPCapped(skill: SkillType): number;
    function GetWeight(): number;
    function GetRunEnergy(): number;
    function GetCombatLevel(): number;
    function GetTrackingID(): string;
}
