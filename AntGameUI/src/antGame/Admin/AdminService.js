import axios from "axios";

export const getStats = async () => {
  return axios.get("/api/admin/stats").then(res => {
    return res.data;
  });
};
