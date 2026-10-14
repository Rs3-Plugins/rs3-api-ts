/** @noSelfInFile */

interface QuestProgressVar {
    readonly varPlayer: VarProxy;
}

interface QuestTypeProxy extends ConfigTypeProxy, ParamHolder {
    readonly name: string;
    readonly sortName: string;
    readonly deprecated: boolean;
    readonly hasStartedQuest: boolean;
    readonly hasFinishedQuest: boolean;
    readonly canStartQuest: boolean;
    readonly difficulty: QuestDifficulty;
    readonly type: QuestType;
    readonly isMembers: boolean;
    readonly questPoints: number;
    readonly iconID: number;
    readonly preReqQuests: unknown;
    readonly preReqSkills: unknown;
    readonly preReqQuestPoints: number;
    readonly completedPreReqQuests: unknown;
    readonly completedPreReqSkills: unknown;
    readonly completedPreReqQuestPoints: number;
    readonly masterQuestVars: QuestProgressVar[];
    readonly startCoordGrids: CoordGrid[];
    readonly viaCoordGrid: CoordGrid | undefined;
}
