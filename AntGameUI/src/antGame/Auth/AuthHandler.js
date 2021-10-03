import jwt_decode from "jwt-decode";
import axios from "axios";
import { getToken, getAnonToken } from "./AuthService";
import { sendRunArtifact } from "../Challenge/ChallengeService";
import LogRocket from "logrocket";

class AuthHandler {
  constructor() {
    this._loggedIn = false;
    this.configureInterceptors();

    this.jwt = localStorage.getItem("jwt");
    if (this.jwt) {
      const decodedToken = jwt_decode(this.jwt);
      if (decodedToken.exp * 1000 > new Date().getTime()) {
        this._loggedIn = true;
        this.decodedToken = decodedToken;
        this.configureLogRocket();
      } else {
        this.jwt = "";
        localStorage.removeItem("jwt");
      }
    }
  }

  set token(newToken) {
    this._loggedIn = true;
    this.jwt = newToken;
    this.decodedToken = jwt_decode(this.jwt);
    localStorage.setItem("jwt", this.jwt);
  }

  get token() {
    return this.jwt;
  }

  get loggedIn() {
    return this._loggedIn;
  }

  get isAnon() {
    if (this.loggedIn) return this.decodedToken.anon === true;
    else return null;
  }

  get isAdmin() {
    if (this.loggedIn) return this.decodedToken.admin === true;
    return null;
  }

  get username() {
    if (this.loggedIn) return this.decodedToken.username;
    else return null;
  }

  configureLogRocket() {
    if (window.location.host === "antgame.io") {
      LogRocket.init("epzwap/antgame");

      if (this.isAnon) {
        LogRocket.identify(this.decodedToken.clientID, {
          name: "Anon User",
        });
      } else {
        LogRocket.identify(this.decodedToken.id, {
          name: this.decodedToken.username,
        });
      }
    } else console.log("Not initializing logrocket");
  }

  configureInterceptors() {
    axios.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        const onLogin = window.location.pathname.includes("/login");
        if (error.response.status === 401 && !onLogin) {
          this.logout();
          const pathBack = window.location.pathname;
          window.location = `/login?redirect=${pathBack}`;
        } else if (Math.floor(error.response.status / 10) === 50) {
          window.location = "/error";
        }
        return Promise.reject(error);
      }
    );

    axios.interceptors.request.use(config => {
      if (this.token) {
        this.checkForUpdatedToken();
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  checkForUpdatedToken() {
    const savedToken = localStorage.getItem("jwt");
    if (savedToken !== this.jwt) this.token = savedToken;
  }

  login(username, password) {
    return getToken(username, password, localStorage.getItem("client-id"))
      .then(result => {
        this._loggedIn = true;
        this.jwt = result;
        this.decodedToken = jwt_decode(this.jwt);
        this.configureLogRocket();
        localStorage.setItem("jwt", this.jwt);
        localStorage.setItem("checkForMOTD", true);

        this.checkForAndSendUnsentArtifacts();

        return true;
      })
      .catch(e => {
        if (e.response.status === 403) return "banned";
        if (e.response.status === 405) return "disabled";
        return false;
      });
  }

  async checkForAndSendUnsentArtifacts() {
    if (localStorage.getItem("artifactToSend")) {
      // TODO: Verify at least date (recent run) and clientID before sending
      // Saving user and checking that too wouldn't be a bad idea
      sendRunArtifact(JSON.parse(localStorage.getItem("artifactToSend")))
        .then(() => {
          localStorage.removeItem("artifactToSend");
        })
        .catch(e => {
          if (e.response.status === 418 || e.response.status === 400)
            localStorage.removeItem("artifactToSend");
        });
    }
  }

  logout() {
    this._loggedIn = false;
    this.jwt = "";
    localStorage.removeItem("jwt");
  }

  loginAnon() {
    return getAnonToken(localStorage.getItem("client-id")).then(result => {
      this._loggedIn = true;
      this.jwt = result;
      this.decodedToken = jwt_decode(this.jwt);
      this.configureLogRocket();
      localStorage.setItem("jwt", this.jwt);
      return true;
    });
  }
}

const SingletonInstance = new AuthHandler();
export default SingletonInstance;
