import axios from "axios";

export async function sendRunArtifact(artifact) {
  return axios
    .post("/api/challenge/artifact", { data: artifact })
    .then(res => {
      return { result: res.data };
    })
    .catch(err => {
      if (err.response.status === 409) window.location = "/";
      else if (err.response.status === 429) {
        return {
          result: "rateLimit",
          resetTime: parseInt(err.response.headers["ratelimit-reset"]) + 1,
        };
      } else if (err.response.status === 418) {
        setTimeout(() => window.location.reload(), 10000);
        return { result: "rejected" };
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

export async function getReplayConfig(id) {
  return axios
    .get(`/api/challenge/${id}/replay`)
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

export async function getPublicActiveChallenges() {
  return axios
    .get("/api/public/activeChallenges")
    .then(res => {
      return res.data;
    })
    .catch(error => {
      console.log(error);
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

export async function getLeaderboard(challengeID, pageNumber) {
  return axios
    .get(`/api/challenge/${challengeID}/leaderboard/${pageNumber}`)
    .then(res => {
      if (res.status === 204) return null;
      return res.data;
    })
    .catch(error => {
      console.error(error);
      return null;
    });
}

export async function getPublicLeaderboard(challengeID, pageNumber) {
  return axios
    .get(`/api/public/challengeLeaderboard/${challengeID}/${pageNumber}`)
    .then(res => {
      if (res.status === 204) return null;
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
    .get(`/api/public/dailyList`)
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
    .then(res => {
      return { seed: res.data.seed, compatibilityDate: res.data.compatibilityDate };
    })
    .catch(() => false);
}

export async function getPreviousRunData({ challengeId, pageIndex }) {
  return axios
    .get(`/api/challenge/${challengeId}/runs/${pageIndex}`)
    .then(res => res.data)
    .catch(() => []);
}
