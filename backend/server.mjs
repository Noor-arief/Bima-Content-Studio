import http from "node:http";

const port = Number(process.env.PORT || 3000);
const serviceName = "bima-content-studio-api";
const supportedOrigins = new Set(["https://noor-arief.github.io"]);
const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
  });
  res.end(JSON.stringify(data));
};

const app = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const origin = req.headers.origin;
  // No credentialed CORS policy or mutable endpoints until owner authentication exists.
  if (origin && !supportedOrigins.has(origin)) {
    return json(res, 403, { error: "origin_not_allowed" });
  }
  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, {
      service: serviceName,
      status: "scaffold",
      publishEnabled: false,
      oauthEnabled: false,
      connectedChannel: false,
    });
  }
  if (req.method === "GET" && url.pathname === "/ready") {
    return json(res, 503, {
      status: "not_ready",
      reason: "OAuth, persistent encrypted tokens, private media storage and publishing queue are not implemented",
    });
  }
  return json(res, 404, { error: "not_found" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`${serviceName} scaffold listening on ${port}; upload/publishing disabled`);
});
