/** @noSelfInFile */

declare namespace config {
    namespace Achievement {
        function FromID(id: number): AchievementTypeProxy | undefined;
    }
    namespace BaseAnimSet {
        function FromID(id: number): BASTypeProxy | undefined;
    }
    namespace Cursor {
        function FromID(id: number): CursorTypeProxy | undefined;
    }
    namespace DBRow {
        function FromID(id: number): DBRowTypeProxy | undefined;
    }
    namespace DBTable {
        function FromID(id: number): DBTableTypeProxy | undefined;
    }
    namespace Enum {
        function FromID(id: number): EnumTypeProxy | undefined;
    }
    namespace Font {
        function FromID(id: number): FontConfigProxy | undefined;
    }
    namespace Headbar {
        function FromID(id: number): HeadbarTypeProxy | undefined;
    }
    namespace Hitmark {
        function FromID(id: number): HitmarkTypeProxy | undefined;
    }
    namespace Inv {
        function FromID(id: number): InvConfigProxy | undefined;
    }
    namespace Loc {
        function FromID(id: number): LocTypeProxy | undefined;
    }
    namespace MapElement {
        function FromID(id: number): MapElementTypeProxy | undefined;
    }
    namespace NPC {
        function FromID(id: number): NPCTypeProxy | undefined;
    }
    namespace Obj {
        function FromID(id: number): ObjTypeProxy | undefined;
    }
    namespace Param {
        function FromID(id: number): ParamTypeProxy | undefined;
    }
    namespace Quest {
        function FromID(id: number): QuestTypeProxy | undefined;
    }
    namespace Seq {
        function FromID(id: number): SeqTypeProxy | undefined;
    }
    namespace Struct {
        function FromID(id: number): StructTypeProxy | undefined;
    }
}
