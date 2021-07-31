const { getChallengeByChallengeId } = require("../dao/ChallengeDao");

// Hard-coded game config values
const AntsToSpawn = 1000;
const FoodPerCell = 20;
const DirtPerCell = 50;

const VerifyArtifact = async (runData, clientID) => {
  if (runData.ClientID !== clientID) return "non-matching clientID";
  if (!ScoreMatchesFinalSnapshot(runData)) return "non matching reported and final snapshot score";
  if (!SnapshotLengthMatchesConfigTime(runData)) return "not enough snapshots for config time";
  if (!SystemElapsedTimeLongerThanConfigTime(runData)) return "system elapsed time shorter than config time";
  const expectedConfig = await getChallengeByChallengeId(runData.challengeID);
  const ConfigMatchResult = ReportedConfigMatchesExpectedConfig(runData, expectedConfig);
  if (ConfigMatchResult !== true) return `reported config did not match expected : ${ConfigMatchResult}`;
  return "verified";
};

const ReportedConfigMatchesExpectedConfig = (runData, expectedConfig) => {
  const TimeMatches = expectedConfig.seconds === runData.GameConfig.Time;
  if (!TimeMatches) return "Time mismatch";

  const MapPathMatches = expectedConfig.mapPath === runData.GameConfig.MapPath;
  if (!MapPathMatches) return "MapPath mismatch";

  const CorrectNumberOfHomes = parseInt(expectedConfig.homeLimit) >= runData.HomeLocations.length;
  if (!CorrectNumberOfHomes) return "Too many homes";

  const antsPerCell = Math.round(AntsToSpawn / runData.HomeLocations.length);
  const expectedAntsSpawned = antsPerCell * runData.HomeLocations.length;
  const AntsToSpawnMatches = expectedAntsSpawned === runData.GameConfig.spawnedAnts;
  if (!AntsToSpawnMatches) return "spawned ants mismatched mismatch";

  const FoodPerCellMatches = FoodPerCell === runData.GameConfig.FoodPerCell;
  if (!FoodPerCellMatches) return "FoodPerCell mismatch";

  const DirtPerCellMatches = DirtPerCell === runData.GameConfig.DirtPerCell;
  if (!DirtPerCellMatches) return "DirtPerCell mismatch";
  return true;
};

const SystemElapsedTimeLongerThanConfigTime = runData => {
  const systemElapsedTimeMilis = runData.Timing.SystemStopTime - runData.Timing.SystemStartTime;
  const systemElapsedTimeSecs = Math.round(systemElapsedTimeMilis / 1000);
  const minTimeElapsed = runData.GameConfig.Time;
  return systemElapsedTimeSecs >= minTimeElapsed;
};

const SnapshotLengthMatchesConfigTime = runData => {
  const numOfSnapshots = runData.Snapshots.length;
  const configTime = runData.GameConfig.Time;
  const minNumOfSnapshots = configTime / 5;
  return numOfSnapshots >= minNumOfSnapshots;
};

const ScoreMatchesFinalSnapshot = runData => {
  const snapshotScore = Math.round(runData.Snapshots[runData.Snapshots.length - 1][2] * 100000);
  return runData.Score === snapshotScore;
};

module.exports = { VerifyArtifact };
