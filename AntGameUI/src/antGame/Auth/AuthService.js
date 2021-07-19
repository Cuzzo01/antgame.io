import axios from "axios";

export async function getToken(username, password, clientID) {
  return axios.post("/api/auth/login", { user: username, pass: password, clientID: clientID }).then(res => {
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
    .post("/api/auth/register", { username: username, password: password, email: email, clientID: clientID })
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
