const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const MapHandler = require("../handler/MapHandler");
const Logger = require("../Logger");
const { default: axios } = require("axios");
const { getChallengeDetailsByID } = require("../dao/Dao");

if (isMainThread) {
  module.exports = {
    SpawnVerificationRun: async function SpawnRunVerification({ runData }) {
      const challengeDetails = await getChallengeDetailsByID({ challengeID: runData.challengeID });

      if (!challengeDetails.mapID) throw "tried to VerifyRun on config with no mapID";

      const mapInfo = await MapHandler.getMapData({ mapID: challengeDetails.mapID });
      const mapData = (await axios.get(`http://antgame.io/asset/${mapInfo.url}`)).data.Map;

      return new Promise((resolve, reject) => {
        const cleanedRun = { ...runData };
        cleanedRun._id = cleanedRun._id.toString();
        cleanedRun.challengeID = cleanedRun.challengeID.toString();
        cleanedRun.userID = cleanedRun.userID.toString();
        const worker = new Worker(__filename, {
          workerData: { run: cleanedRun, mapData, time: challengeDetails.seconds },
        });
        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", code => {
          if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
      });
    },
  };
} else {
  const Run = async () => {
    const startTime = new Date();
    const { VerifyRun } = require("../AntEngine/RunVerifier");
    const data = workerData;
    const result = await VerifyRun({ run: data.run, mapData: data.mapData, time: data.time });

    const totalTime = new Date() - startTime;
    Logger.logVerificationMessage({
      message: "run verification result",
      time: totalTime,
      result,
    });

    parentPort.postMessage(result);
  };
  Run();
}
