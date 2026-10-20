/**
 * Local runner for the template pipeline when the full website server
 * is not started. Same paths as routes/templatePipelineRoutes.js.
 *
 *   node services/templatePipeline/devServer.js
 */

const http = require("http");
const { listTemplates, readTemplate, reviewTemplate } = require("./store");

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (error) { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 200, {});
  const url = (req.url || "").split("?")[0];
  const query = new URL(req.url || "/", "http://localhost").searchParams;
  try {
    if (req.method === "GET" && url === "/api/template-pipeline") {
      return send(res, 200, { templates: listTemplates(query.get("status") || undefined) });
    }
    const review = url.match(/^\/api\/template-pipeline\/([^/]+)\/review$/);
    if (req.method === "POST" && review) {
      const body = await readBody(req);
      const deck = reviewTemplate(review[1], body.status);
      if (!deck) return send(res, 404, { error: "Template not found" });
      return send(res, 200, { id: deck.id, status: deck.status });
    }
    const one = url.match(/^\/api\/template-pipeline\/([^/]+)$/);
    if (req.method === "GET" && one) {
      const deck = readTemplate(one[1]);
      if (!deck) return send(res, 404, { error: "Template not found" });
      return send(res, 200, deck);
    }
    return send(res, 404, { error: "Not found" });
  } catch (error) {
    return send(res, error.status || 500, { error: error.message });
  }
});

server.listen(5000, () => console.log("pipeline on 5000"));
