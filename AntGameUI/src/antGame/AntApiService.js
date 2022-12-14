import axios from "axios";

export const isApiHealthy = () => {
  return axios
    .get("/api/health")
    .then(res => res.status === 200)
    .catch(() => false);
};
