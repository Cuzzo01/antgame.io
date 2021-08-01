import styles from "./AdminHome.module.css";
import AdminRouter from "./AdminRouter";
import { Link } from "react-router-dom";

const AdminHome = props => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Portal</h1>
        <div className={styles.nav}>
          <Link to="/admin/stats">Stats</Link>
          <Link to="/admin/runs">Runs</Link>
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/configs">Configs</Link>
        </div>
      </div>
      <div className={styles.activePage}>
        <AdminRouter />
      </div>
    </div>
  );
};

export default AdminHome;
