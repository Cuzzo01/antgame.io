import AntGame from "./AntGame";
import ChallengeList from "./Challenge/List/ChallengeList";
import LoginPage from "./LoginPage/LoginPage";
import { Config } from "./config";
import { BrowserRouter, Switch, Route, Redirect, useParams } from "react-router-dom";
import { GameModeContext } from "./GameModeContext";
import AuthHandler from "./Auth/AuthHandler";
import UserBar from "./UserBar/UserBar";
import Leaderboard from "./Challenge/Leaderboard/Leaderboard";

const SampleMaps = Config.SampleMaps;
const PreloadMapPath = Config.SampleMaps[Config.DefaultPreload];

const AntGameRouter = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/">
          <GameModeContext.Provider value={"sandbox"}>
            <AntGame mapToLoad={PreloadMapPath} />
          </GameModeContext.Provider>
        </Route>
        <Route path="/login">
          <LoginPage />
        </Route>
        <Route exact path="/challenge">
          <ChallengeList />
          <UserBar />
        </Route>
        <Route path="/challenge/leaderboard/:id">
          <Leaderboard />
          <UserBar />
        </Route>
        <Route exact path="/challenge/:id">
          <ChallengeMap />
          <UserBar showRecords={true} />
        </Route>
        <Route path="/map/:mapName">
          <LoadMapFromParams />
        </Route>
        <Route path="/">
          <Redirect to="/" />
        </Route>
      </Switch>
    </BrowserRouter>
  );
};

const ChallengeMap = () => {
  let { id } = useParams();
  if (!AuthHandler.loggedIn) return <Redirect to={`/login?redirect=/challenge/${id}`} />;
  return (
    <GameModeContext.Provider value={{ mode: "challenge", challengeID: id }}>
      <AntGame />
      {/* < */}
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
