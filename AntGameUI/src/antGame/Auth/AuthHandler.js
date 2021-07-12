import jwt_decode from "jwt-decode";
import axios from "axios";
import { getToken, getAnonToken } from "./AuthService";

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

  get loggedIn() {
    return this._loggedIn;
  }

  get token() {
    return this.jwt;
  }

  get isAnon() {
    if (this.loggedIn) {
      return this.decodedToken.anon === true;
    } else return null;
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
        if (error.response.status === 401) {
          this.logout();
          const pathBack = window.location.pathname;
          window.location = `/login?redirect=${pathBack}`;
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
    return getToken(username, password).then(result => {
      this._loggedIn = true;
      this.jwt = result;
      this.decodedToken = jwt_decode(this.jwt);
      localStorage.setItem("jwt", this.jwt);

      return true;
    });
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
