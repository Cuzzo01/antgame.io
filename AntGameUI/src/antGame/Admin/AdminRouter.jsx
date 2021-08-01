import { Route, Switch, useParams } from "react-router-dom";
import ConfigDetails from "./ConfigDetails/ConfigDetails";
import ConfigList from "./ConfigList/ConfigList";
import Stats from "./Stats/Stats";

const AdminRouter = () => {
  return (
    <Switch>
      <Route path="/admin/stats">
        <Stats />
      </Route>
      <Route path="/admin/runs">Runs</Route>
      <Route path="/admin/users">Users</Route>
      <Route path="/admin/configs">
        <ConfigList />
      </Route>
      <Route path="/admin/config/:id">
        <ConfigDetailsPage />
      </Route>
    </Switch>
  );
};
export default AdminRouter;

const ConfigDetailsPage = () => {
  let { id } = useParams();
  return <ConfigDetails id={id} />;
};
