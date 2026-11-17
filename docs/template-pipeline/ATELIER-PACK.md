# Slidexy Atelier — Premium Pack

## Pack members (active)

| ID | Name | Language | Buyer |
|----|------|----------|-------|
| `lumen-stage` | Lumen Stage | Void, hard beam, lifted plates | Keynotes / launches |

**Ship bar:** communication first → system second → metaphor last.  
Wave 2 (`ferrotype`, `sumi-field`, `kiln-slab`) is demoted to drafts until it clears that bar.

**Active draft proof:** `carta-folio` — beige paper + wine/teal/mustard + Antonio/Poppins + framed photos (craft from beige-minimal portfolio refs). Not premium until QA clears the bar.

```powershell
node -r ts-node/register/transpile-only scripts/generate-carta-folio.ts --publish-local
```

**Rule:** never ship two Atelier decks that share the same plate/card recipe. Drafts stay out of the paid pack.

Source of truth: `scripts/lib/atelierPack.ts` → `ATELIER_PACK_IDS`.

## Generate / publish

```powershell
node -r ts-node/register/transpile-only scripts/generate-atelier-pack.ts --only=lumen-stage --publish-local
# Draft rebuild proof:
node -r ts-node/register/transpile-only scripts/generate-atelier-wave2.ts --only=ferrotype --publish-local
```

## Flutter sync

```powershell
$env:FLUTTER_ROOT="C:\Users\SP Grid\Desktop\Techinoid\slidesX-Flutter-POC"
npm run sync:tier-b-flutter
# or --only=lumen-stage
```

Bundled paid decks must carry `"premium": true`. Drafts must not.
