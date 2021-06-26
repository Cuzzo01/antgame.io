import AntGame from "./AntGame";
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
const ChallengeMapPath = Config.Challenge.MapPath;

const AntGameRouter = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/">
          <GameModeContext.Provider value={"sandbox"}>
            <AntGame mapToLoad={PreloadMapPath} />
          </GameModeContext.Provider>
        </Route>
        <Route path="/challenge">
          <GameModeContext.Provider value={"challenge"}>
            <AntGame mapToLoad={ChallengeMapPath} />
          </GameModeContext.Provider>
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

const LoadMapFromParams = () => {
  let { mapName } = useParams();
  const lowerMapName = mapName.toLowerCase();
  if (SampleMaps[lowerMapName])
    return <AntGame mapToLoad={SampleMaps[lowerMapName]} />;
  return <Redirect to="/" />;
};

export default AntGameRouter;
