# Slidexy kit authoring from design guides

Create a reusable layout kit, using the selected family and blueprint below. Work in Slidexy-BE. The LLM that writes DeckSpec continues to write content and token IDs only; geometry belongs in kit JSON.

1. Read engine/schemas/kit.schema.json, the selected existingKitStartingPoints, engine/render.ts and engine/selectVariant.ts before editing. Check engine/deckspec.schema.json and engine/sequences.ts when introducing a variant. A guide does not register a runtime variant.
2. Keep the selected role. Use id "<role>/<variant>", with variant equal to the selected ref-* blueprint name. Create kit/<role>/<variant>.json. Do not overwrite a locked kit.
3. Use 1600 x 900 engine coordinates. The supplied blueprint has already been scaled; do not scale twice. Preserve its layout silhouette, alignment axes and empty fields. Bounds are estimates from raster references.
4. Define slots, fit rules and pptxMapping for dynamic content. Use existing from bindings such as title, caption, body, body0, photo, photo0 and chart only where the renderer supports them. Match image slots with photoSlots and requiresPhoto.
5. Make all title and body text editable. Map tokenColor/tokenFill to existing palette roles. Map typography into supported fontRole, fontSize, lineHeight and align fields. Do not copy fontFamilyClass or other guide-only fields into the runtime expecting them to work.
6. Respect export floors: titles >=40 engine units, body and metadata >=24, chart labels >=20. Use family preferred sizes when space permits. Reference-derived small body text has intentionally been enlarged for readability. Shorten copy or split content instead of reducing these floors.
7. Use rectangles, native images and supported masks for geometry. Map charts following report/chart-panel.json and current chart rendering code. Do not flatten text, data or a whole slide into an image.
8. Fades and grain are background intent, not assumed engine features. For unsupported fades use an explicit supported plate or a clean crop; note the deviation. Do not silently invent a fade property. Never use the supplied reference screenshot as a background asset.
9. Keep chart values, dates, logo identities, people and prices dynamic. Do not reuse the reference business, contact details or claims as defaults. For missing logos or icons, report the required asset; do not fabricate an affiliation.
10. Declare z and stable morphId values. Keep a draft status and a simple fade motion block. Do not auto-promote to approved or locked.
11. A new role/variant must be accepted by DeckSpec validation and selected by the relevant selector/sequence before claiming runtime support. Sequence pools or theme locks may override variantHint. Check final selections instead of assuming the hint was honored.
12. Run raw AJV kit-schema validation, the existing schema gate and TypeScript compiler. Render one representative slide with short content and one with the longest intended content. Check PPTX readability, whitespace, image crop, overflow and editability.

Variation policy: select one structural mutation from the family recipe, keep the other anchors fixed, and compare the silhouette with the original. A palette or font swap alone is not a new template structure.

Acceptance: valid kit JSON; complete bindings; no clipped text; reserved whitespace respected; fonts above floors; no missing required assets; final selections use the intended kit. Record unsupported effects and any changed source proportions.
