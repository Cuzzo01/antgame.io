import React from "react";
import ReactDOM from "react-dom";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import GTMInitialize from "./GTMInitialize";
import AntGameRouter from "./antGame/AntGameRouter";

GTMInitialize();

ReactDOM.render(
  <React.StrictMode>
    <AntGameRouter />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
