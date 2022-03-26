import axios from "axios";

export const getStats = async () => {
  return axios.get("/api/admin/stats").then(res => {
    return res.data;
  });
};

export const getConfigList = async () => {
  return axios.get("/api/admin/configList").then(res => {
    return res.data;
  });
};

export const getConfigDetails = async id => {
  return axios.get(`/api/admin/config/${id}`).then(res => {
    return res.data;
  });
};

export const getUserDetails = async id => {
  return axios.get(`/api/admin/user/${id}`).then(res => {
    return res.data;
  });
};

export const getRecentlyCreatedUsers = async count => {
  return axios
    .get(`/api/admin/users`, { params: { by: "recentlyCreated", count: count } })
    .then(res => {
      return res.data;
    });
};

export const getRecentlyLoggedInUsers = async count => {
  return axios
    .get(`/api/admin/users`, { params: { by: "recentlyLoggedIn", count: count } })
    .then(res => {
      return res.data;
    });
};

export const patchUserDetails = async (id, fields) => {
  return axios
    .patch(`/api/admin/user/${id}`, fields)
    .then(res => {
      return res.data;
    })
    .catch(e => {
      return false;
    });
};

export const patchConfigDetails = async (id, fields) => {
  return axios
    .patch(`/api/admin/config/${id}`, fields)
    .then(res => {
      return true;
    })
    .catch(e => {
      return false;
    });
};

export const postConfig = async newConfig => {
  return axios
    .post(`/api/admin/config`, newConfig)
    .then(res => {
      return res.data;
    })
    .catch(e => {
      return false;
    });
};

export const getRecentRuns = async count => {
  return axios.get("/api/admin/runs", { params: { by: "recent", count: count } }).then(res => {
    return res.data;
  });
};

export const getRunDetails = async id => {
  return axios.get(`/api/admin/run/${id}`).then(res => {
    return res.data;
  });
};

export const getChampionshipList = async () => {
  return axios.get("/api/admin/championshipList").then(res => {
    return res.data;
  });
};

export const getChampionshipDetails = async id => {
  return axios.get(`/api/admin/championship/${id}`).then(res => {
    return res.data;
  });
};

export const getFlagList = async () => {
  return axios.get("/api/admin/flags").then(res => {
    return res.data;
  });
};

export const getFlagDetails = async id => {
  return axios.get(`/api/admin/flagData/${id}`).then(res => {
    return res.data;
  });
};

export const updateFlagDetails = async (id, fields) => {
  return axios.patch("/api/admin/flagData/" + id, fields).then(res => {
    return res.data;
  });
};

export const markRunForVerification = async id => {
  return axios.post("/api/admin/verifyRun", { runID: id });
};
