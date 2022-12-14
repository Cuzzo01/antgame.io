// tracing.js
"use strict";

// import { context, trace } from "@opentelemetry/api";
// import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
// import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
// import { NodeSDK } from "@opentelemetry/sdk-node";

const { NodeSDK } = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");
const TelemAPI = require("@opentelemetry/api");

// The Trace Exporter exports the data to Honeycomb and uses
// the environment variables for endpoint, service name, and API Key.
const traceExporter = new OTLPTraceExporter();

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingPaths: ["/health"],
        ignoreOutgoingUrls: [/logz\.io/],
      },
    }),
  ],
});

export const setAttributes = ({
  userID = undefined,
  clientID = undefined,
  username = undefined,
}) => {
  const activeSpan = TelemAPI.trace.getSpan(TelemAPI.context.active());
  if (!activeSpan) return;
  if (userID) activeSpan.setAttribute("user.id", userID);
  if (clientID) activeSpan.setAttribute("user.clientID", clientID);
  if (username) activeSpan.setAttribute("user.name", username);
};

sdk.start();
