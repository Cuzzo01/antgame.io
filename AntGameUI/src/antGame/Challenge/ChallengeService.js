import axios from "axios";

export async function sendRunArtifact(artifact) {
  return axios
    .post("/api/challenge/artifact", { data: artifact })
    .then(res => {
      return res.data;
    })
    .catch(err => {
      if (err.response.status === 409) window.location = "/";
      else if (err.response.status === 429) return "rateLimit";
      else if (err.response.status === 418) {
        setTimeout(() => window.location.reload(), 10000);
        return "rejected";
      } else window.location.reload();
    });
}

export async function getChallengeConfig(id) {
  return axios
    .get(`/api/challenge/${id}`)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      console.error(error);
      window.location = "/";
    });
}

export async function getActiveChallenges() {
  return axios
    .get("/api/challenges/active")
    .then(res => {
      return res.data;
    })
    .catch(error => {
      console.error(error);
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
      console.error(error);
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
      console.error(error);
      return null;
    });
}

export async function getPRInfo(challengeID) {
  return axios
    .get(`/api/challenge/${challengeID}/pr`)
    .then(res => {
      return { locations: res.data.locations, amounts: res.data.amounts };
    })
    .catch(error => {
      console.error(error);
      return null;
    });
}

export async function getDailyChallengeList() {
  return axios
    .get(`/api/challenge/dailyList`)
    .then(res => {
      return res.data;
    })
    .catch(error => {
      console.error(error);
      return [];
    });
}

export async function getSeed({ homeLocations }) {
  return axios
    .post("/api/seed", { homeLocations })
    .then(res => res.data.seed)
    .catch(() => false);
}
