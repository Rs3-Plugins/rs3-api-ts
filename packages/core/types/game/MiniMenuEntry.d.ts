/** @noSelfInFile */

interface MiniMenuEntry {
    readonly verbText: string;
    readonly subjectText: string;
    readonly fullText: string;
    readonly extraText: string;
    readonly overrideText: string;
    readonly cursorID: number;
    readonly iconSpriteIDs: number[];
    readonly actionType: MiniMenuActionType;
    readonly actionVerbType: MiniMenuActionVerbType;
    readonly actionEntryType: MiniMenuEntryType;
    readonly subjectHash: number;
    readonly subjectOnOtherLevel: boolean;
    readonly npcData: MiniMenuEntryDataNPC | undefined;
    readonly locData: MiniMenuEntryDataLoc | undefined;
    readonly objData: MiniMenuEntryDataObj | undefined;
    readonly playerData: MiniMenuEntryDataPlayer | undefined;
    readonly groundData: MiniMenuEntryDataGround | undefined;
    readonly mapElementData: MiniMenuEntryDataMapElement | undefined;
    readonly componentData: MiniMenuEntryDataComponent | undefined;
}
