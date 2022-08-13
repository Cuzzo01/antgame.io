// Hard-coded game config values
const AntsToSpawn = 1000;
const FoodPerCell = 20;
const DirtPerCell = 50;

const VerifyArtifact = ({ runData, clientID, challengeConfig, mapPath }) => {
  if (runData.ClientID !== clientID)
    return `non-matching clientID : (${clientID}, ${runData.ClientID})`;

  try {
    runData.Score = parseInt(runData.Score);
  } catch (e) {
    return "failed to parse score";
  }
  if (!isFinite(runData.Score)) return "score is infinity";

  if (!ScoreMatchesFinalSnapshot(runData)) return "non matching reported and final snapshot score";

  if (!HasExpectedSnapshots(runData)) return "missing snapshots";

  const systemElapsedTimeResult = SystemElapsedTimeLongerThanConfigTime(runData);
  if (systemElapsedTimeResult !== true)
    return `system elapsed time shorter than config time : ${systemElapsedTimeResult}`;

  const ConfigMatchResult = ReportedConfigMatchesExpectedConfig(runData, challengeConfig, mapPath);
  if (ConfigMatchResult !== true)
    return `reported config did not match expected : ${ConfigMatchResult}`;

  return "verified";
};

const HasExpectedSnapshots = runData => {
  if (!runData.Snapshots.start || !runData.Snapshots.finish) return false;
  return true;
};

const ReportedConfigMatchesExpectedConfig = (runData, expectedConfig, mapPath) => {
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

  const CorrectNumberOfHomes = parseInt(expectedConfig.homeLimit) >= runData.HomeLocations.length;
  if (!CorrectNumberOfHomes) return "Too many homes";

  const lastSnapshotHomeCounts = JSON.parse(runData.Snapshots.finish[5]);
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

const SystemElapsedTimeLongerThanConfigTime = runData => {
  const systemElapsedTimeMilis = runData.Timing.SystemStopTime - runData.Timing.SystemStartTime;
  const systemElapsedTimeSecs = Math.round(systemElapsedTimeMilis / 1000);
  const minTimeElapsed = runData.GameConfig.Time;
  const marginOfError = Math.round(minTimeElapsed * 0.05);
  if (systemElapsedTimeSecs < minTimeElapsed - marginOfError)
    return `(${systemElapsedTimeSecs}, ${minTimeElapsed - marginOfError})`;
  return true;
};

const ScoreMatchesFinalSnapshot = runData => {
  const snapshotScore = Math.round(runData.Snapshots.finish[2] * 100000);
  return runData.Score === snapshotScore;
};
module.exports = { VerifyArtifact };
