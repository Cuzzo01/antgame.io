import axios from "axios";

export async function sendRunArtifact(artifact) {
  return axios
    .post("/api/challenge/artifact", { data: artifact })
    .then((res) => {
      return res;
    });
}

export async function getChallengeConfig() {
  return axios.get("/api/challenge/config").then((res) => {
    return res.data;
  });
}
