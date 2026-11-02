/**
 * Checks which image generators are actually reachable.
 *
 *   node --env-file=.env scripts/test-image-providers.js          status only
 *   node --env-file=.env scripts/test-image-providers.js --live   generate one
 *
 * The status pass costs nothing. The live pass asks each configured
 * provider for one small image, which on the paid ones costs real money,
 * so it is opt-in.
 *
 * Run this first whenever slides come back with stock photos instead of
 * generated art: it answers "is anything configured" and "does the
 * configured thing still work" in one go, which the server logs make you
 * piece together.
 */

const path = require("path");
const { imageProviderStatus, generateFallbackImageDetailed } = require(
  path.join(__dirname, "..", "services", "fallbackImageGeneration")
);

const PROMPT =
  "abstract geometric composition in teal and orange, soft studio lighting, " +
  "no text, no letters, widescreen presentation background";

async function main() {
  const live = process.argv.includes("--live");

  console.log("\nImage providers\n");

  const status = imageProviderStatus();
  for (const p of status) {
    const mark = p.configured ? "ready     " : "not set up";
    console.log("  " + mark + "  " + p.name.padEnd(13) + (p.missing || ""));
  }

  const ready = status.filter((p) => p.configured);
  console.log("\n  " + ready.length + " of " + status.length + " providers configured");

  if (!ready.length) {
    console.log(
      "\n  Nothing can generate an image. The quickest fix is Cloudflare " +
        "Workers AI:\n  set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env.\n"
    );
    process.exitCode = 1;
    return;
  }

  if (!live) {
    console.log("\n  Pass --live to actually generate one image through the chain.\n");
    return;
  }

  console.log("\nGenerating one image through the chain\n");

  const started = Date.now();
  try {
    const { image, provider } = await generateFallbackImageDetailed(PROMPT);
    const bytes = Math.round(((image.split(",")[1] || "").length * 3) / 4 / 1024);
    console.log(
      "  " + provider + " produced a " + bytes + " KB image in " +
        ((Date.now() - started) / 1000).toFixed(1) + "s\n"
    );
  } catch (err) {
    console.log("  " + err.message + "\n");
    process.exitCode = 1;
    return;
  }
}

// Setting exitCode rather than calling process.exit lets the open
// sockets from the providers close themselves. Exiting on top of them
// trips a libuv assertion on Windows, which looks like a crash at the
// end of a run that actually succeeded.
main().then(
  () => { process.exitCode = 0; },
  (err) => {
    console.error(err);
    process.exitCode = 1;
  }
);
