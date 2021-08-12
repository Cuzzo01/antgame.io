import axios from "axios";

export async function getFlag(name) {
  return axios.get(`/api/flag/${name}`).then(res => {
    return res.data;
  });
}
