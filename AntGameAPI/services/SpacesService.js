const AWS = require("aws-sdk");

class spacesService {
  initializeConnection() {
    if (!this.s3) {
      this.spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
      this.s3 = new AWS.S3({
        endpoint: this.spacesEndpoint,
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
      });
    }
  }

  uploadFile(fileName, fileToUpload, ContentType) {
    this.s3.putObject(
      {
        Bucket: process.env.DO_SPACES_NAME,
        Key: fileName,
        Body: fileToUpload,
        ACL: "public-read",
        ContentType,
      },
      err => {
        if (err) return console.log(err);
      }
    );
  }

  uploadDailyMap(mapName, mapFile) {
    let fileName = `dailyMaps/${mapName}.json`;
    if (process.env.environment !== "PROD") fileName = "dev/" + fileName;
    this.uploadFile(fileName, JSON.stringify(mapFile), "application/json");
    return fileName;
  }

  uploadRecordImage(challengeName, image) {
    let fileName = `recordImages/${challengeName.replaceAll(" ", "_")}-WR.png`;
    if (process.env.environment !== "PROD") fileName = "dev/" + fileName;
    this.uploadFile(fileName, image, "image/png");
    return fileName;
  }
}

const SpacesService = new spacesService();
module.exports = SpacesService;
