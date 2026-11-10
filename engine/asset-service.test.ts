import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
const { AssetService, CACHE_ROOT } = require("./asset-service");
const sharp = require("sharp");

async function main() {
  const originalFetch = globalThis.fetch;
  const query = `cache-regression-${process.pid}`;
  const prefix = path.join(CACHE_ROOT, "icon", query + "-123456");
  const files = [prefix + ".png", prefix + ".svg", prefix + "-fallback.png"];
  try {
    const service = new AssetService();
    let calls = 0;
    globalThis.fetch = (async () => { calls++; throw new Error("simulated outage"); }) as any;
    const failed = await service.getIcon(query, { color: "#123456" });
    assert.strictEqual(failed.mocked, true);
    assert.ok(fs.existsSync(failed.path), "fallback remains renderable");
    assert.ok(!fs.existsSync(prefix + ".svg"), "failure must not poison normal cache");

    // Reproduce cache files left by the previous integration implementation.
    const placeholder = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#123456"/></svg>';
    fs.writeFileSync(prefix + ".svg", placeholder);
    fs.writeFileSync(prefix + ".png", await sharp(Buffer.from(placeholder)).png().toBuffer());
    globalThis.fetch = (async (url: any) => {
      calls++;
      return String(url).includes("/search?")
        ? { ok: true, json: async () => ({ icons: ["test:triangle"] }) }
        : { ok: true, text: async () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2 22 22H2Z"/></svg>' };
    }) as any;
    const recovered = await service.getIcon(query, { color: "#123456" });
    assert.strictEqual(recovered.source, "network");
    assert.strictEqual(recovered.iconId, "test:triangle");
    assert.strictEqual(calls, 3, "legacy placeholder must trigger search and SVG fetch");
    const cached = await service.getIcon(query, { color: "#123456" });
    assert.strictEqual(cached.source, "cache");
    assert.strictEqual(calls, 3, "successful assets reuse cache");
    console.log("PASS: failed assets stay mocked; legacy placeholders retry; successful icons cache.");
  } finally {
    globalThis.fetch = originalFetch;
    for (const file of files) if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
