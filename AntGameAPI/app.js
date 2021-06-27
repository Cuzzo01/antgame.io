const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;

const _challengeController = require("./controller/ChallengeController");

app.use(bodyParser.json({ extended: true }));

app.post("/challenge/artifact", _challengeController.postRun);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
