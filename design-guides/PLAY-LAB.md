# PLAY / LAB

A reusable 12-slide creative sprint template: oversized symbols, warm paper, near-black fields and orange accents. Use icons as the main visual subject, rather than placing small icons next to every paragraph.

- Cover: oversized question on the left, rocket inside a dark circle on the right.
- Identity feature: full-height dark left panel and large fingerprint; concise prompt and exercise on the right.
- Experiment feature: three rising steps for Ask / Make / Test, ending with a flask.

Generate with `node -r ts-node/register/transpile-only scripts/generate-play-lab.ts`. Outputs are in `out/play-lab`; reusable JSON kits are `kit/cover/play-lab-poster.json`, `kit/feature/play-lab-identity.json` and `kit/feature/play-lab-experiment.json`. The output `spec.json` includes explicit selections and required brand overrides. Kits are approved. Publish to the local backend catalog with `npm run publish:play-lab:local`; this uses the existing admin publication flow and verifies catalog listing, 12 previews and PPTX download. The published ID is `play-lab`, served at `/api/catalog/play-lab`. This does not deploy to a remote environment or add an entry to the separate frontend block-template list.

Iconify is exercised through the existing smartAsset renderer: search, SVG retrieval, orange tint, PNG preparation, cached reuse and PPTX export. Live results in this run were `material-symbols:rocket`, `material-symbols:fingerprint` and `mdi:flask`. Search ordering can change after cache removal; the integration currently chooses the first result. The `style` field partitions the cache; it does not select an Iconify family. Icons in PPTX are image assets; slide text and shapes remain editable.

The integration check rejects mocked icons and text truncation. A separate deterministic regression test (`engine/asset-service.test.ts`) checks failed requests and recovery from old placeholder cache entries. PNGs were visually reviewed. PowerPoint output was exported, but not opened in desktop PowerPoint. During local publication, the existing PPTX round-trip gate reported that it was skipped because conversion tooling was unavailable.


`nExpanded sequence: cover, agenda, challenge, curiosity, key insight, idea exploration, concept comparison, Ask/Make/Test, experiment plan, example results, next steps and closing. The next-steps slide uses an editable native table. Example results are explicitly illustrative. All 12 kits are included in the package.
