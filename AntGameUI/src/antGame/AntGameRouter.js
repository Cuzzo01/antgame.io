import AntGame from "./AntGame";
import ChallengePage from "./ChallengePage/ChallengePage";
import { Config } from "./config";
import {
  BrowserRouter,
  Switch,
  Route,
  Redirect,
  useParams,
} from "react-router-dom";
import { GameModeContext } from "./GameModeContext";

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
        <Route exact path="/challenge">
          <ChallengePage />
        </Route>
        <Route path="/challenge/:id">
          <ChallengeMap />
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
