import { Nav } from "react-bootstrap";
import { Route, Switch, useHistory } from "react-router";
import styles from "./AdminHome.module.css";
import Stats from "./Stats/Stats";

const AdminHome = props => {
  const history = useHistory();
  const handleSelect = eventKey => history.push(`/admin/${eventKey}`);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Portal</h1>
        <Nav variant="tabs" onSelect={handleSelect}>
          <Nav.Item>
            <Nav.Link eventKey="stats">Stats</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="runs">Runs</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="users">Users</Nav.Link>
          </Nav.Item>
        </Nav>
      </div>
      <div className={styles.activePage}>
        <Switch>
          <Route path="/admin/stats">
            <Stats />
          </Route>
          <Route path="/admin/runs">Runs</Route>
          <Route path="/admin/users">Users</Route>
        </Switch>
      </div>
    </div>
  );
};

export default AdminHome;
