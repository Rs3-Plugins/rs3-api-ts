/** @noSelfInFile */

declare namespace ui {
    enum PlayerOpType {
        NONE = -1,
        FRIEND = 0,
        GROUP_MEMBER = 1,
        GROUP_BANNED = 2,
        CLAN_MEMBER = 3,
        CLAN_GUEST = 4,
        FRIEND_CHAT = 5,
    }
    namespace PlayerOpType {
        function FromID(id: number): PlayerOpType;
    }
}
