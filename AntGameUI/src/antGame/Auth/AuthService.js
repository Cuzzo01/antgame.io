import axios from "axios";

export async function getToken(username, password) {
  return axios.post("/api/auth/login", { user: username, pass: password }).then(res => {
    return res.data;
  });
}

export async function getAnonToken(clientID) {
  return axios.post("/api/auth/anonToken", { clientID: clientID }).then(res => {
    return res.data;
  });
}
