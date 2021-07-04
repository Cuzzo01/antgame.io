import axios from "axios";

export async function sendRunArtifact(artifact) {
  return axios
    .post("/api/challenge/artifact", { data: artifact })
    .then((res) => {
      return res;
    });
}

export async function getChallengeConfig(id) {
  return axios.get(`/api/challenge/${id}`).then((res) => {
    return res.data;
  });
}

export async function getActiveChallenges() {
  return axios
    .get("/api/challenges/active")
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      return [];
    });
}

export async function getRecords(challengeID) {
  return axios
    .get(`/api/challenge/${challengeID}/records`)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      return null;
    });
}
