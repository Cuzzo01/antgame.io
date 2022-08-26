// const AWS = require("aws-sdk");
import AWS from "aws-sdk";

export class SpacesServiceProvider {
  private static service: SpacesService;

  static getService(): SpacesService {
    if (this.service) return this.service;
    this.service = new SpacesService();
    this.service.initializeConnection();
    return this.service;
  }
}

class SpacesService {
  private s3: AWS.S3;
  private spacesEndpoint: AWS.Endpoint;

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

  async uploadFile(fileName: string, fileToUpload: AWS.S3.Body, ContentType: string) {
    return new Promise<void>((resolve, reject) => {
      this.s3.putObject(
        {
          Bucket: process.env.DO_SPACES_NAME,
          Key: fileName,
          Body: fileToUpload,
          ACL: "public-read",
          ContentType,
        },
        err => {
          if (err) {
            console.log(err);
            reject(err);
          }
          resolve();
        }
      );
    });
  }

  async uploadDailyMap(mapName: string, mapFile: object): Promise<string> {
    let fileName = `dailyMaps/${mapName}_${getCacheString()}.json`;
    if (process.env.environment !== "PROD") fileName = "dev/" + fileName;
    await this.uploadFile(fileName, JSON.stringify(mapFile), "application/json");
    return fileName;
  }

  async uploadRecordImage(p: {
    challengeName: string;
    image: Buffer;
    score: number;
    username: string;
  }) {
    const fileName = `${p.score}_${p.username}_WR_${getCacheString()}.png`;
    let filePath = `recordImages/${p.challengeName.replaceAll(" ", "_")}/${fileName}`;
    if (process.env.environment !== "PROD") filePath = "dev/" + filePath;
    await this.uploadFile(filePath, p.image, "image/png");
    return filePath;
  }

  async uploadMapThumbnail(p: { challengeName: string; image: Buffer }) {
    let fileName = `thumbnails/${p.challengeName.replaceAll(" ", "_")}_${getCacheString()}.png`;
    if (process.env.environment !== "PROD") fileName = "dev/" + fileName;
    await this.uploadFile(fileName, p.image, "image/png");
    return fileName;
  }
}

const getCacheString = () => {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
};
