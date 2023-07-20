import { CompatibilityService } from "../bll/CompatibilityService";
import { FullChallengeConfig } from "../models/FullChallengeConfig";
import { HomeFoodAmounts, RunArtifact } from "../models/RunArtifact";

// Hard-coded game config values
const AntsToSpawn = 1000;
const FoodPerCell = 20;
const DirtPerCell = 50;

export function VerifyArtifact(p: {
  runData: RunArtifact;
  clientID: string;
  challengeConfig: FullChallengeConfig;
  mapPath: string;
  isDaily: boolean;
}): string {
  if (p.runData.ClientID !== p.clientID)
    return `non-matching clientID : (${p.clientID}, ${p.runData.ClientID})`;

  if (!isFinite(p.runData.Score)) return "score is infinity";

  if (!ScoreMatchesFinalSnapshot(p.runData))
    return "non matching reported and final snapshot score";

  if (!HasExpectedSnapshots(p.runData)) return "missing snapshots";

  if (!IsAllowedCompatibilityDate(p.runData.GameConfig.compatibilityDate, p.isDaily))
    return "non-allowed compatibility date";

  const systemElapsedTimeResult = SystemElapsedTimeLongerThanConfigTime(p.runData);
  if (systemElapsedTimeResult !== true)
    return `system elapsed time shorter than config time : ${systemElapsedTimeResult}`;

  const ConfigMatchResult = ReportedConfigMatchesExpectedConfig(
    p.runData,
    p.challengeConfig,
    p.mapPath
  );
  if (ConfigMatchResult !== true)
    return `reported config did not match expected : ${ConfigMatchResult}`;

  return "verified";
}

const IsAllowedCompatibilityDate = (compatibilityDate, isDaily) => {
  if (compatibilityDate === CompatibilityService.getCompatibilityDate(new Date())) return true;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (!isDaily && compatibilityDate === CompatibilityService.getCompatibilityDate(yesterday))
    return true;

  return false;
};

const HasExpectedSnapshots = (runData: RunArtifact) => {
  if (!runData.Snapshots.start || !runData.Snapshots.finish) return false;
  return true;
};

const ReportedConfigMatchesExpectedConfig = (
  runData: RunArtifact,
  expectedConfig: FullChallengeConfig,
  mapPath: string
) => {
  const TimeMatches = expectedConfig.seconds === runData.GameConfig.Time;
  if (!TimeMatches) return `Time mismatch (${runData.GameConfig.Time})`;

  const seed = runData.GameConfig.seed;
  if (seed === null || seed === undefined) return `Undefined seed`;
  if (seed < 0 || seed > 1e8) return `Seed out of bounds`;

  let MapPathMatches = false;
  if (expectedConfig.mapPath) {
    MapPathMatches = expectedConfig.mapPath === runData.GameConfig.MapPath;
  } else if (expectedConfig.mapID) {
    MapPathMatches = runData.GameConfig.MapPath.endsWith(mapPath);
  }
  if (!MapPathMatches) return `MapPath mismatch (${runData.GameConfig.MapPath})`;

  const CorrectNumberOfHomes = expectedConfig.homeLimit >= runData.HomeLocations.length;
  if (!CorrectNumberOfHomes) return "Too many homes";

  const lastSnapshotHomeCounts = JSON.parse(
    runData.Snapshots.finish[5] as string
  ) as HomeFoodAmounts;
  const HomesInLastSnapshot = Object.keys(lastSnapshotHomeCounts).length;
  const EndedWithMoreHomesThanStartedWith = runData.HomeLocations.length < HomesInLastSnapshot;
  if (EndedWithMoreHomesThanStartedWith)
    return `ended with more homes than started with (${runData.HomeLocations.length}, ${HomesInLastSnapshot})`;

  const antsPerCell = Math.round(AntsToSpawn / runData.HomeLocations.length);
  const expectedAntsSpawned = antsPerCell * runData.HomeLocations.length;
  const AntsToSpawnMatches = expectedAntsSpawned === runData.GameConfig.spawnedAnts;
  if (!AntsToSpawnMatches) return `spawned ants mismatched (${runData.GameConfig.spawnedAnts})`;

  const FoodPerCellMatches = FoodPerCell === runData.GameConfig.FoodPerCell;
  if (!FoodPerCellMatches) return `FoodPerCell mismatch (${runData.GameConfig.FoodPerCell})`;

  const DirtPerCellMatches = DirtPerCell === runData.GameConfig.DirtPerCell;
  if (!DirtPerCellMatches) return `DirtPerCell mismatch (${runData.GameConfig.DirtPerCell})`;
  return true;
};

const SystemElapsedTimeLongerThanConfigTime = (runData: RunArtifact) => {
  const systemElapsedTimeMilis = runData.Timing.SystemStopTime - runData.Timing.SystemStartTime;
  const systemElapsedTimeSecs = Math.round(systemElapsedTimeMilis / 1000);
  const minTimeElapsed = Math.floor(runData.GameConfig.Time / 2);
  const marginOfError = Math.round(minTimeElapsed * 0.05);
  if (systemElapsedTimeSecs < minTimeElapsed - marginOfError)
    return `(${systemElapsedTimeSecs}, ${minTimeElapsed - marginOfError})`;
  return true;
};

const ScoreMatchesFinalSnapshot = (runData: RunArtifact) => {
  const snapshotScore = Math.round((runData.Snapshots.finish[2] as number) * 100000);
  return runData.Score === snapshotScore;
};
