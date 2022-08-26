export interface AuthToken {
  id?: string;
  username?: string;
  admin: boolean;
  anon?: boolean;
  clientID: string;
  iat?: number;
}
