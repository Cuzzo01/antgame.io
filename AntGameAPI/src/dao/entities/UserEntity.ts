export interface UserEntity {
    username: string,
    username_lower: string,
    passHash: string,
    admin: boolean,
    showOnLeaderboard: boolean,
    loginCount: number,
    loginRecords: LoginRecord[],
    badges: UserBadge[],
    banned: boolean
}

interface UserBadge {
    name: string,
    backgroundColor: string,
    color: string,
    value: number,
    display: boolean,
    icon: string
}

interface LoginRecord {
    IP: string,
    clientID: string,
    time: Date
}