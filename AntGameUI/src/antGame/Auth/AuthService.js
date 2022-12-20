import axios from "axios";

export async function getRefreshToken(username, password, persistLogin, clientID) {
  return axios
    .post("/api/auth/login", { user: username, pass: password, persistLogin, clientID })
    .then(res => {
      return res.data;
    });
}

export async function getAnonToken(clientID) {
  return axios.post("/api/auth/anonToken", { clientID: clientID }).then(res => {
    return res.data;
  });
}

export async function registerAccount(username, password, email, clientID) {
  return axios
    .post("/api/auth/register", {
      username: username,
      password: password,
      email: email,
      clientID: clientID,
    })
    .then(res => {
      return res.data;
    })
    .catch(e => {
      if (e.response.status === 409) {
        return "usernameTaken";
      } else {
        window.location = "/error";
      }
    });
}

export async function getAccessToken() {
  return axios
    .post("/api/auth/accessToken")
    .then(res => res.data)
    .catch(() => false);
}

export async function logout() {
  return axios
    .delete("/api/auth/login")
    .then(() => true)
    .catch(() => false);
}

export async function reportSpacesLoadTime(time, path, status) {
  return axios.post(`/api/report/assets`, { time: time, path: path, status: status });
}
