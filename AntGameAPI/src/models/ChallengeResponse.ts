export interface ChallengeResponse {
  id: string;
  seconds: number;
  homeLimit: number;
  name: string;
  active: boolean;
  mapPath: string | undefined;
}
