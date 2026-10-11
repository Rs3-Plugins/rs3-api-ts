/** @noSelfInFile */

interface AchievementTypeProxy extends ConfigTypeProxy {
    readonly name: string;
    readonly progress: AchievementProgressType;
    readonly hiddenType: AchievementHiddenType;
    readonly isMembers: boolean;
    readonly category: number;
    readonly subCategory: number;
    readonly runeScore: number;
    readonly spriteID: number;
    readonly reward: unknown;
    readonly descriptions: unknown;
    readonly hasRequirementDescriptions: boolean;
    readonly requirements: unknown;
    readonly requirementGroupCount: number;
    readonly totalRequirementCount: number;
    readonly completionCountForRequirementGroups: unknown;
    readonly prereqs: unknown;
    readonly prereqsComplete: boolean;
    readonly prereqGroupCount: number;
    readonly totalPrereqCount: number;
    readonly completionCountForPrereqGroups: unknown;
    readonly tallyProgress: number;
    readonly tallyTarget: number;
    readonly graceExpiryRunedate: number;
    readonly dbRowConfig: DBRowTypeProxy | undefined;
    GetPrereqGroupComplete(group: number): boolean;
    GetSubItemCompletionCountForPrereqGroup(group: number): number;
    GetSubItemCompletionCountForRequirementGroup(group: number): number;
}
