import jwt_decode from "jwt-decode";
import axios from "axios";
import Cookies from "js-cookie";
import { getAccessToken, getAnonToken, getRefreshToken, logout, reportSpacesLoadTime } from "./AuthService";
import { sendRunArtifact } from "../Challenge/ChallengeService";
import { getFlag } from "../Helpers/FlagService";
import { v4 as uuidV4 } from "uuid";
import posthog from "posthog-js";

const TwoHoursInMilliseconds = 1000 * 60 * 60 * 2;
const HalfHourInSeconds = 60 * 30;

class AuthHandler {
  constructor() {
    this._loggedIn = false;

    this.configureInterceptors();

    const jwt = localStorage.getItem("jwt");
    if (!jwt) this.pullNewAccessToken();
    else {
      const decodedToken = jwt_decode(jwt);
      const tokenExpired = decodedToken.exp * 1000 < new Date().getTime();

      if (tokenExpired) {
        localStorage.removeItem("jwt");
        this.pullNewAccessToken();
      } else {
        this.token = jwt;
      }
    }
  }

  set token(newToken) {
    this._loggedIn = true;
    this.jwt = newToken;
    this.decodedToken = jwt_decode(this.jwt);
    localStorage.setItem("jwt", this.jwt);
    posthog.identify(this.decodedToken.id, { username: this.decodedToken.username });
  }

  get token() {
    if (!this.jwt) return false;

    const nowInSeconds = new Date().getTime() / 1000;
    const tokenExpireTime = this.decodedToken.exp;
    const tokenExpired = tokenExpireTime < nowInSeconds;
    if (tokenExpired) return false;

    const token30MinFromExpiring = tokenExpireTime < nowInSeconds + HalfHourInSeconds;
    if (!this.pullingToken && token30MinFromExpiring) this.pullNewAccessToken();

    return this.jwt;
  }

  get isRefreshTokenSet() {
    return Cookies.get("refresh_token") !== undefined;
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
      async error => {
        const onLogin = window.location.pathname.includes("/login");
        const onSandbox = window.location.pathname.includes("sandbox");
        const onError = window.location.pathname.includes("error");

        const errorStatus = error.response?.status;
        const is401Error = errorStatus === 401;
        const is500SeriesError = Math.floor(errorStatus / 10) === 50;

        if (is401Error && this.isRefreshTokenSet) {
          if (this.pullingToken) await this.accessTokenPromise;
          else await this.pullNewAccessToken();

          return axios(error.config);
        } else if (is401Error && !onLogin) {
          await this.logout();
          const pathBack = window.location.pathname;
          window.location.replace(`/login?redirect=${pathBack}`);
        } else if (is500SeriesError && !onSandbox && !onError) {
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
        await this.checkForUpdatedToken();
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      config.headers.client_id = this.clientID;
      return config;
    });
  }

  checkForUpdatedToken() {
    const savedToken = localStorage.getItem("jwt");
    if (savedToken !== this.jwt) this.token = savedToken;
  }

  async pullNewAccessToken() {
    if (!this.isRefreshTokenSet) return;
    if (this.pullingToken) return;

    this.pullingToken = true;
    this.accessTokenPromise = getAccessToken();
    const jwt = await this.accessTokenPromise;

    if (jwt === false) {
      this._loggedIn = false;
      return;
    }

    const forceReload = !this.loggedIn;
    this.token = jwt;
    if (forceReload) window.location.reload();
    this.pullingToken = false;
  }

  login(username, password, persistLogin) {
    return getRefreshToken(username, password, persistLogin, this.clientID)
      .then(async accessToken => {
        this.token = accessToken;
        localStorage.setItem("checkForMOTD", true);

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
    const storedArtifact = localStorage.getItem("artifactToSend");
    if (storedArtifact) {
      // TODO: Verify clientID before sending
      // Saving user and checking that too wouldn't be a bad idea
      const artifactToSend = JSON.parse(storedArtifact);
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

  async logout() {
    this._loggedIn = false;
    this.jwt = "";
    localStorage.removeItem("jwt");
    posthog.reset();

    if (this.isRefreshTokenSet) await logout();
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
