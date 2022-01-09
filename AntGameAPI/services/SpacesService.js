const AWS = require("aws-sdk");

class spacesService {
  initializeConnection() {
    if (!this.s3) {
      if (!process.env.DO_SPACES_ENDPOINT) require("dotenv").config();
      this.spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
      this.s3 = new AWS.S3({
        endpoint: this.spacesEndpoint,
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
      });
    }
  }

  uploadFile(fileName, fileToUpload) {
    this.s3.putObject(
      {
        Bucket: process.env.DO_SPACES_NAME,
        Key: fileName,
        Body: JSON.stringify(fileToUpload),
        ACL: "public-read",
      },
      (err, data) => {
        if (err) return console.log(err);
      }
    );
  }

  uploadDailyMap(mapName, mapFile) {
    let fileName = `dailyMaps/${mapName}.json`;
    if (process.env.environment === "DEV") fileName = "dev/" + fileName;
    this.uploadFile(fileName, mapFile);
    return `https://${process.env.DO_SPACES_NAME}.${process.env.DO_SPACES_ENDPOINT}${fileName}`;
  }
}

const SpacesService = new spacesService();
module.exports = SpacesService;
