// Hard-coded game config values
const AntsToSpawn = 1000;
const FoodPerCell = 20;
const DirtPerCell = 50;

const VerifyArtifact = (runData, clientID, challengeConfig) => {
  if (runData.ClientID !== clientID)
    return `non-matching clientID : (${clientID}, ${runData.ClientID})`;

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

  const systemElapsedTimeResult = SystemElapsedTimeLongerThanConfigTime(runData);
  if (systemElapsedTimeResult !== true)
    return `system elapsed time shorter than config time : ${systemElapsedTimeResult}`;

  const ConfigMatchResult = ReportedConfigMatchesExpectedConfig(runData, challengeConfig);
  if (ConfigMatchResult !== true)
    return `reported config did not match expected : ${ConfigMatchResult}`;

  const SnapshotAnalysis = AnalyzeSnapshots(runData.Snapshots);
  if (SnapshotAnalysis !== true) return `snapshot analysis failed : ${SnapshotAnalysis}`;

  return "verified";
};

const ReportedConfigMatchesExpectedConfig = (runData, expectedConfig) => {
  const TimeMatches = expectedConfig.seconds === runData.GameConfig.Time;
  if (!TimeMatches) return `Time mismatch (${runData.GameConfig.Time})`;

  const MapPathMatches = expectedConfig.mapPath === runData.GameConfig.MapPath;
  if (!MapPathMatches) return `MapPath mismatch (${runData.GameConfig.mapPath})`;

  const CorrectNumberOfHomes = parseInt(expectedConfig.homeLimit) >= runData.HomeLocations.length;
  if (!CorrectNumberOfHomes) return "Too many homes";

  const NumOfSnapshots = runData.Snapshots.length;
  const lastSnapshotHomeCounts = JSON.parse(runData.Snapshots[NumOfSnapshots - 1][5]);
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
  const marginOfError = Math.round(minTimeElapsed * 0.01);
  if (systemElapsedTimeSecs < minTimeElapsed - marginOfError)
    return `(${systemElapsedTimeSecs}, ${minTimeElapsed - marginOfError})`;
  return true;
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
  // FIXME: Should this value be validated? Maybe store it in the DB for each map?
  const totalFood = snapshots[0][3];
  const totalSeconds = snapshots[0][1];

  let lastSnapshot = false;
  let deltaExceptions = [];
  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];

    const gameTime = snapshot[1];
    const percent = snapshot[2];
    const foodOnMap = snapshot[3];
    const foodInTransit = snapshot[4];
    const updateCount = snapshot[6];
    let homeFoodCounts;
    try {
      homeFoodCounts = JSON.parse(snapshot[5]);
    } catch (e) {
      throw "Unparsable snapshot";
    }

    let currentFoodReturned = 0;
    for (const [, foodCount] of Object.entries(homeFoodCounts)) {
      currentFoodReturned += foodCount;
    }

    if (percent !== 0) {
      const calculatedPercent = currentFoodReturned / totalFood;
      if (calculatedPercent !== percent)
        return `calculated percent doesn't match reported (${calculatedPercent},  ${i})`;
    }

    const percentGuess = (totalFood - (foodOnMap + foodInTransit)) / totalFood;
    const guessDelta = Math.round(Math.abs(percent - percentGuess) * 10000);
    if (guessDelta > 0) deltaExceptions.push([i, guessDelta]);

    const secondsElapsed = totalSeconds - gameTime;
    const expectedUpdateCount = secondsElapsed * 1.5 * 30;
    if (updateCount !== expectedUpdateCount)
      return `calculated seconds elapsed dont match reported (${expectedUpdateCount}, ${updateCount}, ${i})`;

    if (lastSnapshot) {
      // Disabling due to high false positive rate
      // FIXME: Is this check important? Should it be deleted or just reworked?
      // const gameTimeDelta = lastSnapshot[1] - snapshot[1];
      // if (gameTimeDelta > 6) return `game time delta out of bounds (${gameTimeDelta}, ${i})`;

      const time = snapshot[0];
      const lastTime = lastSnapshot[0];
      const timeDelta = time - lastTime;
      if (timeDelta < 0) return `negative snapshot time delta : (${timeDelta}, ${i})`;

      const score = snapshot[2];
      const lastScore = lastSnapshot[2];
      if (lastScore > 0.1) {
        const scoreDelta = score - lastScore;
        const percentScoreDelta = (scoreDelta / lastScore) * 100;
        if (percentScoreDelta < 0)
          return `negative score change between snapshots (${percentScoreDelta.toFixed(2)}, ${i})`;
        let outOfBounds = false;
        if (lastScore < 0.2) {
          if (percentScoreDelta !== Infinity && percentScoreDelta > 150)
            outOfBounds = `(${percentScoreDelta}, ${i}, 150)`;
        } else if (lastScore < 0.4) {
          if (percentScoreDelta !== Infinity && percentScoreDelta > 110)
            outOfBounds = `(${percentScoreDelta}, ${i}, 100)`;
        } else if (lastScore < 0.6) {
          if (percentScoreDelta !== Infinity && percentScoreDelta > 50)
            outOfBounds = `(${percentScoreDelta}, ${i}, 50)`;
        } else {
          if (percentScoreDelta !== Infinity && percentScoreDelta > 25)
            outOfBounds = `(${percentScoreDelta}, ${i}, 25)`;
        }
        if (outOfBounds !== false) return `score change out of bounds (${percentScoreDelta}, ${i})`;
      }
    }

    lastSnapshot = snapshot;
  }
  if (deltaExceptions.length > 0) return `guess delta exceptions (${deltaExceptions})`;
  return true;
};

module.exports = { VerifyArtifact };
