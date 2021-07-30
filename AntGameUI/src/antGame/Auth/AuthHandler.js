import jwt_decode from "jwt-decode";
import axios from "axios";
import { getToken, getAnonToken } from "./AuthService";
import { sendRunArtifact } from "../Challenge/ChallengeService";

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

  get loggedIn() {
    return this._loggedIn;
  }

  get token() {
    return this.jwt;
  }

  get isAnon() {
    if (this.loggedIn) return this.decodedToken.anon === true;
    else return null;
  }

  get username() {
    if (this.loggedIn) return this.decodedToken.username;
    else return null;
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
        } else if (Math.round(error.response.status / 10) === 50) {
          window.location = "/error";
        }
        return Promise.reject(error);
      }
    );

    axios.interceptors.request.use(config => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  login(username, password) {
    return getToken(username, password, localStorage.getItem("client-id"))
      .then(result => {
        this._loggedIn = true;
        this.jwt = result;
        this.decodedToken = jwt_decode(this.jwt);
        localStorage.setItem("jwt", this.jwt);

        this.checkForAndSendUnsentArtifacts();

        return true;
      })
      .catch(e => {
        return false;
      });
  }

  async checkForAndSendUnsentArtifacts() {
    if (localStorage.getItem("artifactToSend")) {
      // TODO: Verify at least date (recent run) and clientID before sending
      // Saving user and checking that too wouldn't be a bad idea
      await sendRunArtifact(JSON.parse(localStorage.getItem("artifactToSend")));
      localStorage.removeItem("artifactToSend");
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
      localStorage.setItem("jwt", this.jwt);
      return true;
    });
  }
}

const SingletonInstance = new AuthHandler();
export default SingletonInstance;
