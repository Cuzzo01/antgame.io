import { useForm } from "react-hook-form";
import { useHistory } from "react-router";
import { postConfig } from "../AdminService";
import styles from "./CreateConfig.module.css";

const CreateConfig = () => {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const history = useHistory();

  const onSubmit = data => {
    const newConfig = {
      name: data.name,
      mapPath: data.mapPath,
      time: data.time,
      homeLimit: data.homeLimit,
    };
    postConfig(newConfig).then(result => {
      if (result) history.push(`/admin/config/${result}`);
    });
  };

  return (
    <div>
      <h4>New Config</h4>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.inputGroup}>
          <label htmlFor="Name">Name</label>
          <input {...register("name", { required: true, maxLength: 25 })} />
          {errors.name?.type === "required" && <ErrorMessage>Required</ErrorMessage>}
          {errors.name?.type === "maxLength" && <ErrorMessage>Cannot be over 25 characters</ErrorMessage>}
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="mapPath">Map Path</label>
          <input {...register("mapPath", { required: true })} />
          {errors.mapPath?.type === "required" && <ErrorMessage>Required</ErrorMessage>}
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="time">Time (seconds)</label>
          <input {...register("time", { required: true })} type="number" />
          {errors.time?.type === "required" && <ErrorMessage>Required</ErrorMessage>}
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="homeLimit">Home Limit</label>
          <input {...register("homeLimit", { required: true })} type="number" />
          {errors.homeLimit?.type === "required" && <ErrorMessage>Required</ErrorMessage>}
        </div>
        <button type="submit">Create Config</button>
      </form>
    </div>
  );
};
export default CreateConfig;

const ErrorMessage = props => {
  return <p className={styles.errorMessage}>{props.children}</p>;
};
