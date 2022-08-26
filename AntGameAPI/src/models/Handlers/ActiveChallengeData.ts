import { SkinnyChallengeConfig } from "../SkinnyChallengeConfig";
import { RecordDetails } from "../RecordDetails";

export interface ActiveChallengeData {
  challenges: SkinnyChallengeConfig[];
  worldRecords: RecordDetails[];
}
