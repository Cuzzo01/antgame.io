import { Route, Switch, useParams } from "react-router-dom";
import ChampionshipDetails from "./ChampionshipDetails/ChampionshipDetails";
import ChampionshipList from "./ChampionshipList/ChampionshipList";
import ConfigDetails from "./ConfigDetails/ConfigDetails";
import ConfigList from "./ConfigList/ConfigList";
import CreateConfig from "./CreateConfig/CreateConfig";
import FlagDetails from "./FlagDetails/FlagDetails";
import FlagList from "./FlagList/FlagList";
import RunDetails from "./RunDetails/RunDetails";
import RunsList from "./Runs/RunsList";
import Stats from "./Stats/Stats";
import UserDetails from "./UserDetails/UserDetails";
import UserList from "./Users/UserList";

const AdminRouter = () => {
  return (
    <Switch>
      <Route path="/admin/stats">
        <Stats />
      </Route>
      <Route path="/admin/runs">
        <RunsList />
      </Route>
      <Route path="/admin/run/:id">
        <RunDetailsPage />
      </Route>
      <Route path="/admin/users">
        <UserList />
      </Route>
      <Route path="/admin/user/:id">
        <UserDetailsPage />
      </Route>
      <Route path="/admin/configs">
        <ConfigList />
      </Route>
      <Route path="/admin/newConfig">
        <CreateConfig />
      </Route>
      <Route path="/admin/config/:id">
        <ConfigDetailsPage />
      </Route>
      <Route path="/admin/flags">
        <FlagList />
      </Route>
      <Route path="/admin/flag/:id">
        <FlagDetailsPage />
      </Route>
      <Route path="/admin/championships">
        <ChampionshipList />
      </Route>
      <Route path="/admin/championship/:id">
        <ChampionshipDetailsPage />
      </Route>
    </Switch>
  );
};
export default AdminRouter;

const ConfigDetailsPage = () => {
  let { id } = useParams();
  return <ConfigDetails id={id} />;
};

const UserDetailsPage = () => {
  let { id } = useParams();
  return <UserDetails id={id} />;
};

const RunDetailsPage = () => {
  let { id } = useParams();
  return <RunDetails id={id} />;
};

const FlagDetailsPage = () => {
  let { id } = useParams();
  return <FlagDetails id={id} />;
};

const ChampionshipDetailsPage = () => {
  let { id } = useParams();
  return <ChampionshipDetails id={id} />;
};
