export interface AuthDetails {
  // TODO: this sucks, don't leave it
  _id?: string;
  id?: string;
  username: string;
  passHash: string;
  admin: boolean;
  showOnLeaderboard: boolean;
  banned: boolean;
  banInfo: BanInfo;
}

export interface BanInfo {
  message: string;
}
