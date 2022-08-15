import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";

export const InitializeTracing = () => {
  const traceExporter = new OTLPTraceExporter();

  const sdk = new NodeSDK({
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-http": { ignoreIncomingPaths: ["/health"] },
      }),
    ],
  });

  sdk
    .start()
    .then()
    .catch(e => {
      throw e;
    });
};
