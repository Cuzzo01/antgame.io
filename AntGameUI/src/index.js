import React from "react";
import ReactDOM from "react-dom";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import AntGameRouter from "./antGame/AntGameRouter";
import "./index.css";

import { PostHogProvider } from "posthog-js/react";

ReactDOM.render(
  <React.StrictMode>
    <PostHogProvider
      apiKey="phc_SFH4QQfmZAgNUNlofR2AYEyMZAWFcwOlyqj9faFpI4L"
      options={{ api_host: "https://us.posthog.com" }}
    >
      <AntGameRouter />
    </PostHogProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
