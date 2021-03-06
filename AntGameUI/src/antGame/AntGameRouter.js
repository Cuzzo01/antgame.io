import { Config } from "./config";
import { BrowserRouter, Switch, Route, Redirect, useParams } from "react-router-dom";
import { GameModeContext } from "./GameModeContext";
import AuthHandler from "./Auth/AuthHandler";
import styles from "./Helpers/GenericStyles.module.css";
import { lazy, Suspense } from "react";
import ErrorPage from "./ErrorPage/ErrorPage";
import UserBar from "./UserBar/UserBar";
import ChallengeList from "./Challenge/List/ChallengeList";
import MOTD from "./MOTD/Motd";

const SampleMaps = Config.SampleMaps;
const PreloadMapPath = Config.SampleMaps[Config.DefaultPreload];

const AdminHome = lazy(() => import("./Admin/AdminHome"));
const AntGame = lazy(() => import("./AntGame"));
const LoginPage = lazy(() => import("./Auth/LoginPage/LoginPage"));
const RegistrationPage = lazy(() => import("./Auth/RegistrationPage/RegistrationPage"));
const Leaderboard = lazy(() => import("./Challenge/Leaderboard/Leaderboard"));
const ChampionshipDetails = lazy(() =>
  import("./Championship/ChampionshipDetails/ChampionshipDetails")
);
const Footer = lazy(() => import("./Helpers/Footer"));

const AntGameRouter = () => {
  return (
    <Suspense fallback={<div></div>}>
      <BrowserRouter>
        <Switch>
          <Route path="/sandbox">
            <GameModeContext.Provider value={{ mode: "sandbox" }}>
              <AntGame mapToLoad={PreloadMapPath} />
            </GameModeContext.Provider>
            <UserBar showLinkHome />
          </Route>
          <Route exact path="/challenge/:id">
            <ChallengeMap />
            <UserBar showRecords />
          </Route>
          <Route>
            <div className={styles.windowContainer}>
              <Switch>
                <Route exact path="/error">
                  <ErrorPage />
                </Route>
                <Route path="/admin">
                  <AdminPath />
                  <UserBar />
                </Route>
                <Route path="/register">
                  <RegistrationPage />
                </Route>
                <Route path="/map/:mapName">
                  <LoadMapFromParams />
                </Route>
                <Route>
                  <Switch>
                    <Route exact path="/">
                      <MOTD />
                      <ChallengeList />
                      <UserBar showLinkToSandbox />
                    </Route>
                    <Route path="/login">
                      <LoginPage />
                    </Route>
                    <Route path="/challenge/:id/leaderboard">
                      <Leaderboard />
                      <UserBar />
                    </Route>
                    <Route exact path="/championship/:id">
                      <ChampionshipDetails />
                      <UserBar />
                    </Route>
                    <Route path="/">
                      <Redirect to="/" />
                    </Route>
                  </Switch>
                  <Footer />
                </Route>
              </Switch>
            </div>
          </Route>
        </Switch>
      </BrowserRouter>
    </Suspense>
  );
};

const AdminPath = () => {
  if (!AuthHandler.loggedIn) return <Redirect to={`/login?redirect=${window.location.pathname}`} />;
  if (!AuthHandler.isAdmin) return <Redirect to={"/"} />;

  return (
    <div>
      <AdminHome />
    </div>
  );
};

const ChallengeMap = () => {
  let { id } = useParams();
  if (!AuthHandler.loggedIn) return <Redirect to={`/login?redirect=/challenge/${id}`} />;
  return (
    <GameModeContext.Provider value={{ mode: "challenge", challengeID: id }}>
      <AntGame />
    </GameModeContext.Provider>
  );
};

const LoadMapFromParams = () => {
  let { mapName } = useParams();
  const lowerMapName = mapName.toLowerCase();
  if (SampleMaps[lowerMapName])
    return (
      <GameModeContext.Provider value={"sandbox"}>
        <AntGame mapToLoad={SampleMaps[lowerMapName]} />
      </GameModeContext.Provider>
    );
  return <Redirect to="/" />;
};

export default AntGameRouter;
