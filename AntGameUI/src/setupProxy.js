const createProxyMiddleware = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://antgame.io/",
      // target: "http://localhost:8080",
      // pathRewrite: { "^/api": "" },
      changeOrigin: true,
    })
  );
};
