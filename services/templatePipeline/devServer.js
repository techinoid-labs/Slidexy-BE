/**
 * Local runner for the template pipeline when the full website server
 * is not started. Same paths as routes/templatePipelineRoutes.js, plus
 * the loopback-only admin curator.
 *
 *   node services/templatePipeline/devServer.js
 */

const fs = require("fs");
const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const { listTemplates, readTemplate, reviewTemplate } = require("./store");
const {
  listLayouts,
  setLayoutDisabled,
  ingestPptx,
  scoreLayout,
  generateTemplate,
  previewPath,
  pptxPath,
  ensurePptx,
  readReplacements,
  publishTemplate,
  discardTemplate,
  reviewConsole,
} = require("./adminCatalog");
const { listCatalog, readCatalog, slideFile, buildPptx } = require("./catalog");

const DASHBOARD = path.join(__dirname, "..", "..", "docs", "template-pipeline", "admin-dashboard", "index.html");
const CATALOG = path.join(__dirname, "..", "..", "docs", "template-pipeline", "user-catalog", "index.html");

function loopback(req) {
  const address = req.socket && req.socket.remoteAddress;
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

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

function readBuffer(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        const error = new Error("That PowerPoint is larger than 120 MB");
        error.status = 413;
        reject(error);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("error", reject);
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 200, {});
  const url = (req.url || "").split("?")[0];
  const query = new URL(req.url || "/", "http://localhost").searchParams;
  try {
    if (req.method === "GET" && (url === "/catalog" || url === "/catalog/")) {
      const html = fs.readFileSync(CATALOG);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(html);
      return;
    }
    if (url === "/api/catalog" && req.method === "GET") {
      return send(res, 200, { decks: listCatalog() });
    }
    const catalogSlide = url.match(/^\/api\/catalog\/([^/]+)\/slides\/([^/]+)$/);
    if (req.method === "GET" && catalogSlide) {
      const file = slideFile(decodeURIComponent(catalogSlide[1]), decodeURIComponent(catalogSlide[2]));
      const bytes = fs.readFileSync(file);
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": bytes.length, "Cache-Control": "no-store" });
      res.end(bytes);
      return;
    }
    const catalogDownload = url.match(/^\/api\/catalog\/([^/]+)\/download$/);
    if (req.method === "POST" && catalogDownload) {
      const file = await buildPptx(decodeURIComponent(catalogDownload[1]));
      res.writeHead(200, {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": "attachment; filename=\"" + file.filename + "\"",
        "Content-Length": file.buffer.length,
      });
      res.end(file.buffer);
      return;
    }
    const catalogOne = url.match(/^\/api\/catalog\/([^/]+)$/);
    if (req.method === "GET" && catalogOne) {
      return send(res, 200, readCatalog(decodeURIComponent(catalogOne[1])));
    }
    if (req.method === "GET" && (url === "/" || url === "/admin" || url === "/admin-dashboard")) {
      const html = fs.readFileSync(DASHBOARD);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(html);
      return;
    }
    if (url.startsWith("/api/admin")) {
      if (!loopback(req)) return send(res, 403, { error: "Access denied. Admins only." });
      if (req.method === "GET" && url === "/api/admin/layouts") {
        return send(res, 200, { layouts: listLayouts() });
      }
      if (req.method === "POST" && url === "/api/admin/upload-seed") {
        const buffer = await readBuffer(req, 120 * 1024 * 1024);
        return send(res, 200, ingestPptx(buffer, query.get("name") || ""));
      }
      if (req.method === "POST" && url === "/api/admin/score-seed") {
        const body = await readBody(req);
        return send(res, 200, await scoreLayout(body.id));
      }
      if (req.method === "POST" && url === "/api/admin/disable-seed") {
        const body = await readBody(req);
        return send(res, 200, setLayoutDisabled(body.id, body.disabled !== false));
      }
      if (req.method === "POST" && url === "/api/admin/generate-template") {
        const body = await readBody(req);
        return send(res, 200, await generateTemplate(body));
      }
      const download = url.match(/^\/api\/admin\/download\/([^/]+)$/);
      if (req.method === "GET" && download) {
        const file = await ensurePptx(decodeURIComponent(download[1]));
        const bytes = fs.readFileSync(file);
        res.writeHead(200, {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": "attachment; filename=\"" + path.basename(file) + "\"",
          "Content-Length": bytes.length,
        });
        res.end(bytes);
        return;
      }
      const replacements = url.match(/^\/api\/admin\/replacements\/([^/]+)$/);
      if (req.method === "GET" && replacements) {
        return send(res, 200, readReplacements(decodeURIComponent(replacements[1])));
      }
      const preview = url.match(/^\/api\/admin\/preview\/([^/]+)\/([^/]+)$/);
      if (req.method === "GET" && preview) {
        const file = previewPath(decodeURIComponent(preview[1]), decodeURIComponent(preview[2]));
        const bytes = fs.readFileSync(file);
        res.writeHead(200, { "Content-Type": "image/png", "Content-Length": bytes.length, "Cache-Control": "no-store" });
        res.end(bytes);
        return;
      }
      if (req.method === "POST" && url === "/api/admin/publish-template") {
        const body = await readBody(req);
        return send(res, 200, await publishTemplate(body.id));
      }
      if (req.method === "POST" && url === "/api/admin/discard-template") {
        const body = await readBody(req);
        return send(res, 200, discardTemplate(body.id));
      }
      const reviewOne = url.match(/^\/api\/admin\/review\/([^/]+)$/);
      if (req.method === "GET" && reviewOne) {
        return send(res, 200, reviewConsole.getReviewPayload(decodeURIComponent(reviewOne[1])));
      }
      if (req.method === "POST" && reviewOne) {
        const body = await readBody(req);
        return send(res, 200, reviewConsole.submitReview(decodeURIComponent(reviewOne[1]), body));
      }
      if (req.method === "GET" && url === "/api/admin/reviews") {
        return send(res, 200, { reviews: reviewConsole.listReviews(), jobs: reviewConsole.listJobsForReview() });
      }
      const replayOne = url.match(/^\/api\/admin\/replay\/([^/]+)$/);
      if (req.method === "POST" && replayOne) {
        return send(res, 200, await reviewConsole.replayReview(decodeURIComponent(replayOne[1])));
      }
      if (req.method === "GET" && url === "/api/admin/gallery") {
        return send(res, 200, await reviewConsole.getGallery());
      }
      if (req.method === "POST" && url === "/api/admin/gallery/flag") {
        const body = await readBody(req);
        return send(res, 200, reviewConsole.setGalleryFlag(body));
      }
      const galleryPng = url.match(/^\/api\/admin\/gallery\/png\/([^/]+)$/);
      if (req.method === "GET" && galleryPng) {
        const file = reviewConsole.galleryPngPath(decodeURIComponent(galleryPng[1]));
        const bytes = fs.readFileSync(file);
        res.writeHead(200, { "Content-Type": "image/png", "Content-Length": bytes.length, "Cache-Control": "no-store" });
        res.end(bytes);
        return;
      }
      if (req.method === "GET" && url === "/api/admin/panel") {
        return send(res, 200, reviewConsole.getPanel());
      }
      if (req.method === "POST" && url === "/api/admin/panel/run") {
        return send(res, 200, await reviewConsole.runPanel());
      }
      if (req.method === "POST" && url === "/api/admin/ppt-check") {
        const body = await readBody(req);
        return send(res, 200, reviewConsole.setPptCheck(body));
      }
      if (req.method === "GET" && url === "/api/admin/git-status") {
        return send(res, 200, reviewConsole.gitDirtyCount());
      }
    }
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

const port = Number(process.env.PIPELINE_PORT) || 5000;
server.requestTimeout = 0;
server.headersTimeout = 0;
server.timeout = 0;
server.listen(port, "127.0.0.1", () => console.log("admin curator on http://127.0.0.1:" + port));
