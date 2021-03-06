import jwt_decode from "jwt-decode";
import axios from "axios";
import { getToken, getAnonToken, reportSpacesLoadTime } from "./AuthService";
import { sendRunArtifact } from "../Challenge/ChallengeService";
import { getFlag } from "../Helpers/FlagService";
import { v4 as uuidV4 } from "uuid";

const TwoHoursInMilliseconds = 1000 * 60 * 60 * 2;

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

  get clientID() {
    const clientID = localStorage.getItem("client-id");
    if (!clientID) {
      const newID = uuidV4();
      localStorage.setItem("client-id", newID);
      return newID;
    } else return clientID;
  }

  configureInterceptors() {
    axios.interceptors.response.use(
      response => {
        if (response.config.metadata?.startTime) {
          const loadTime = new Date() - response.config.metadata.startTime;
          reportSpacesLoadTime(loadTime, response.config.url, response.status);
        }
        return response;
      },
      error => {
        const onLogin = window.location.pathname.includes("/login");
        if (error.response?.status === 401 && !onLogin) {
          this.logout();
          const pathBack = window.location.pathname;
          window.location.replace(`/login?redirect=${pathBack}`);
        } else if (Math.floor(error.response?.status / 10) === 50) {
          window.location = "/error";
        }
        return Promise.reject(error);
      }
    );

    axios.interceptors.request.use(async config => {
      if (config.url.includes("antgame.io/assets/")) {
        config.metadata = { startTime: new Date() };
        return config;
      } else if (config.url.includes("digitaloceanspaces.com")) {
        config.metadata = { startTime: new Date() };
        if (await getFlag("use-spaces-proxy")) {
          const url = config.url.split("/");
          const pathStart = 1 + url.findIndex(a => a.includes("digitaloceanspaces.com"));
          const path = `https://antgame.io/assets/${url.slice(pathStart).join("/")}`;
          config.url = path;
        }
        return config;
      }
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
    return getToken(username, password, this.clientID)
      .then(result => {
        this._loggedIn = true;
        this.jwt = result;
        this.decodedToken = jwt_decode(this.jwt);
        localStorage.setItem("jwt", this.jwt);
        localStorage.setItem("checkForMOTD", true);

        this.checkForAndSendUnsentArtifacts();

        return { value: true };
      })
      .catch(e => {
        if (e.response.status === 403) return { value: "banned", message: e.response.data.message };
        if (e.response.status === 405) return { value: "disabled" };
        if (e.response.status === 429)
          return {
            value: "limited",
            retryIn: e.response.headers["ratelimit-reset"],
            message: e.response.data,
          };
        if (e.response.status === 404) return { value: "no user" };
        return { value: false };
      });
  }

  async checkForAndSendUnsentArtifacts() {
    if (localStorage.getItem("artifactToSend")) {
      // TODO: Verify clientID before sending
      // Saving user and checking that too wouldn't be a bad idea
      const artifactToSend = JSON.parse(localStorage.getItem("artifactToSend"));
      if (artifactToSend.Timing.SystemStartTime + TwoHoursInMilliseconds > new Date().getTime())
        sendRunArtifact(artifactToSend)
          .then(() => {
            localStorage.removeItem("artifactToSend");
          })
          .catch(e => {
            const responseCode = e.response.status;
            if (responseCode === 418 || responseCode === 400 || responseCode === 409)
              localStorage.removeItem("artifactToSend");
          });
      else localStorage.removeItem("artifactToSend");
    }
  }

  logout() {
    this._loggedIn = false;
    this.jwt = "";
    localStorage.removeItem("jwt");
  }

  loginAnon() {
    return getAnonToken(this.clientID).then(result => {
      this._loggedIn = true;
      this.jwt = result;
      this.decodedToken = jwt_decode(this.jwt);
      localStorage.setItem("jwt", this.jwt);
      localStorage.setItem("checkForMOTD", true);
      return true;
    });
  }
}

const SingletonInstance = new AuthHandler();
export default SingletonInstance;
