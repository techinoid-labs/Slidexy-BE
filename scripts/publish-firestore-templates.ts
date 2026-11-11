/**
 * Push Tier-B baked decks into the Flutter Firestore catalog shape.
 *
 * Dry-run (default): writes firestore-payload.json under out/tier-b/_firestore/
 * Live publish: set FIRESTORE_PUBLISH=1 and GOOGLE_APPLICATION_CREDENTIALS
 *
 *   node -r ts-node/register/transpile-only scripts/bake-tier-b.ts
 *   node -r ts-node/register/transpile-only scripts/publish-firestore-templates.ts
 *   FIRESTORE_PUBLISH=1 node -r ts-node/register/transpile-only scripts/publish-firestore-templates.ts
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.join(__dirname, "..");
const TIER_B = path.join(ROOT, "out", "tier-b");
const OUT = path.join(TIER_B, "_firestore");

function loadBakedIds(): string[] {
  if (!fs.existsSync(TIER_B)) return [];
  return fs
    .readdirSync(TIER_B)
    .filter((name) => {
      if (name.startsWith("_")) return false;
      return fs.existsSync(path.join(TIER_B, name, "deck.json"));
    })
    .sort();
}

function buildPayload(ids: string[]) {
  const decks: Record<string, any> = {};
  const layouts: Record<string, any> = {};
  for (const id of ids) {
    const deck = JSON.parse(fs.readFileSync(path.join(TIER_B, id, "deck.json"), "utf8"));
    if (!deck.tierB || !deck.tierB.baked) {
      throw new Error(id + " is not Tier-B baked — refuse Firestore publish");
    }
    if (deck.mobileTier !== "B") {
      throw new Error(id + " mobileTier is not B");
    }
    decks[id] = {
      ...deck,
      enabled: true,
      source: "be-published",
      payload: undefined,
    };
    // Prefer document fields = deck JSON (Flutter templateDocumentToJson accepts either)
    delete decks[id].payload;
    const layoutDir = path.join(TIER_B, id, "layouts");
    if (fs.existsSync(layoutDir)) {
      for (const file of fs.readdirSync(layoutDir).filter((f) => f.endsWith(".json"))) {
        const layoutId = file.replace(/\.json$/, "");
        layouts[layoutId] = JSON.parse(fs.readFileSync(path.join(layoutDir, file), "utf8"));
      }
    }
  }
  return {
    catalog: {
      version: Date.now(),
      order: ids,
      source: "be-tier-b",
      updatedAt: new Date().toISOString(),
    },
    decks,
    layouts,
  };
}

async function publishLive(payload: ReturnType<typeof buildPayload>) {
  // Lazy require so dry-run works without firebase-admin installed/configured.
  let admin: any;
  try {
    admin = require("firebase-admin");
  } catch {
    throw new Error("firebase-admin is not installed. Dry-run payload was written; install firebase-admin for live publish.");
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  const db = admin.firestore();
  const catalogRef = db.doc("templates/catalog");
  await catalogRef.set(payload.catalog, { merge: true });
  const batchSize = 400;
  const entries = Object.entries(payload.decks);
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = db.batch();
    for (const [id, deck] of entries.slice(i, i + batchSize)) {
      batch.set(catalogRef.collection("decks").doc(id), deck, { merge: true });
    }
    await batch.commit();
  }
  const layoutEntries = Object.entries(payload.layouts);
  for (let i = 0; i < layoutEntries.length; i += batchSize) {
    const batch = db.batch();
    for (const [id, layout] of layoutEntries.slice(i, i + batchSize)) {
      batch.set(catalogRef.collection("layouts").doc(id), layout as any, { merge: true });
    }
    await batch.commit();
  }
  console.log("Published to Firestore templates/catalog:", Object.keys(payload.decks).join(", "));
}

async function main() {
  const ids = loadBakedIds();
  if (!ids.length) {
    console.error("No baked decks in out/tier-b. Run: npm run bake:tier-b");
    process.exit(1);
  }
  const payload = buildPayload(ids);
  fs.mkdirSync(OUT, { recursive: true });
  const payloadPath = path.join(OUT, "firestore-payload.json");
  fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2) + "\n");
  console.log("Wrote", payloadPath);
  console.log("order:", payload.catalog.order.join(", "));
  console.log("layouts:", Object.keys(payload.layouts).length);

  if (process.env.FIRESTORE_PUBLISH === "1") {
    await publishLive(payload);
  } else {
    console.log("Dry-run only. Set FIRESTORE_PUBLISH=1 (+ ADC credentials) for live write.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
