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
  return axios.get("/admin/runs", { params: { by: "recent", count: count } }).then(res => {
    return res.data;
  });
};
