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
