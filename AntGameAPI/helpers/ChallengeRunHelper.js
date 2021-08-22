const { getChallengeByChallengeId } = require("../dao/ChallengeDao");

// Hard-coded game config values
const AntsToSpawn = 1000;
const FoodPerCell = 20;
const DirtPerCell = 50;

const VerifyArtifact = async (runData, clientID) => {
  if (runData.ClientID !== clientID) return `non-matching clientID : (${clientID, runData.clientID})`;

  try {
    runData.Score = parseInt(runData.Score);
  } catch (e) {
    return "failed to parse score";
  }
  if (!isFinite(runData.Score)) return "score is infinity";

  if (!ScoreMatchesFinalSnapshot(runData)) return "non matching reported and final snapshot score";
  const snapshotLengthResult = SnapshotLengthMatchesConfigTime(runData);
  if (!snapshotLengthResult)
    return `not enough snapshots for config time : ${snapshotLengthResult}`;

  if (!SystemElapsedTimeLongerThanConfigTime(runData))
    return "system elapsed time shorter than config time";

  const expectedConfig = await getChallengeByChallengeId(runData.challengeID);
  const ConfigMatchResult = ReportedConfigMatchesExpectedConfig(runData, expectedConfig);
  if (ConfigMatchResult !== true)
    return `reported config did not match expected : ${ConfigMatchResult}`;

  const SnapshotAnalysis = AnalyzeSnapshots(runData.Snapshots);
  if (SnapshotAnalysis !== true) return `snapshot analysis failed : ${SnapshotAnalysis}`;

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
  const marginOfError = Math.round(minTimeElapsed * 0.01);
  return systemElapsedTimeSecs >= minTimeElapsed - marginOfError;
};

const SnapshotLengthMatchesConfigTime = runData => {
  const numOfSnapshots = runData.Snapshots.length;
  const configTime = runData.GameConfig.Time;
  const minNumOfSnapshots = configTime / 5;
  const marginOfError = Math.ceil(minNumOfSnapshots * 0.01);
  if (numOfSnapshots >= minNumOfSnapshots - marginOfError)
    return `(${numOfSnapshots}, ${minNumOfSnapshots - marginOfError})`;
  return true;
};

const ScoreMatchesFinalSnapshot = runData => {
  const snapshotScore = Math.round(runData.Snapshots[runData.Snapshots.length - 1][2] * 100000);
  return runData.Score === snapshotScore;
};

const AnalyzeSnapshots = snapshots => {
  const totalFood = snapshots[0][3];

  let lastSnapshot = false;
  let deltaExceptions = [];
  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];

    const percent = snapshot[2];
    const foodOnMap = snapshot[3];
    const foodInTransit = snapshot[4];

    const percentGuess = (totalFood - (foodOnMap + foodInTransit)) / totalFood;
    const guessDelta = Math.round(Math.abs(percent - percentGuess) * 10000);
    if (guessDelta > 0) deltaExceptions.push([i, guessDelta]);

    if (!lastSnapshot) lastSnapshot = snapshot;
    else {
      const gameTimeDelta = lastSnapshot[1] - snapshot[1];
      if (gameTimeDelta > 6) return `game time delta out of bounds (${gameTimeDelta}, ${i})`;

      const score = snapshot[2];
      const lastScore = lastSnapshot[2];
      if (lastScore > 0.1) {
        const scoreDelta = score - lastScore;
        const percentScoreDelta = (scoreDelta / lastScore) * 100;
        if (percentScoreDelta < 0)
          return `negative score change between snapshots (${percentScoreDelta.toFixed(2)}, ${i})`;
        const EarlyDelta = score < 0.4;
        const smallPercentDelta = percentScoreDelta !== Infinity && percentScoreDelta > 25;
        const largePercentDelta = percentScoreDelta !== Infinity && percentScoreDelta > 100;
        if ((EarlyDelta && largePercentDelta) || (!EarlyDelta && smallPercentDelta))
          return `score change out of bounds (${percentScoreDelta}, ${i})`;
      }

      lastSnapshot = snapshot;
    }
  }
  if (deltaExceptions.length > 0) return `guess delta exceptions (${deltaExceptions})`;
  return true;
};

module.exports = { VerifyArtifact };
