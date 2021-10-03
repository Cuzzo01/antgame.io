import axios from "axios";

export async function sendRunArtifact(artifact) {
  return axios
    .post("/api/challenge/artifact", { data: artifact })
    .then(res => {
      return res.data;
    })
    .catch(err => {
      if (err.response.status === 409) window.location = "/challenge";
    });
}

export async function getChallengeConfig(id) {
  return axios.get(`/api/challenge/${id}`).then(res => {
    return res.data;
  });
}

export async function getActiveChallenges() {
  return axios
    .get("/api/challenges/active")
    .then(res => {
      return res.data;
    })
    .catch(error => {
      return [];
    });
}

export async function getRecords(challengeID) {
  return axios
    .get(`/api/challenge/${challengeID}/records`)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      return null;
    });
}

export async function getLeaderboard(challengeID) {
  return axios
    .get(`/api/challenge/${challengeID}/leaderboard`)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      return null;
    });
}

export async function getPRHomeLocations(challengeID) {
  return axios
    .get(`/api/challenge/${challengeID}/pr`)
    .then(res => {
      return res.data.home;
    })
    .catch(error => {
      return null;
    });
}
