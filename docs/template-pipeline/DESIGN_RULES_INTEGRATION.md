# Design rules integration

Auto-Assemble was run for the prompt `Corporate Pitch Deck`. The deck on disk is the third attempt, at `docs/template-pipeline/slide-assemblies/corporate-pitch-deck`. The command stopped because no attempt reached the existing score gate of 80. Scores were 64, then 45, then 18.

## What changed

The copywriter prompt in `thematic.js` now includes the slide-writing rules: 25 words of body text, bullets as phrases with no final full stop, no em dashes, subtitles of at most 10 words, and metrics in the form `47%: churn, after the onboarding rebuild`. A rewrite that comes back as two sentences, or longer than 25 words, is rejected and shortened to the first sentence.

`assemble_deck.js` asks for 11 slides in this order: Cover, Contents, About, Problem, Solution, Proof, Market, Model, People, Next, Close. Each role is used once. The geometric labels on the seeds (Title slide, Features, Data/Stats, and so on) are only used to pick a matching slide. They are not the outline.

Decoration files are no longer shuffled into slots. `placeDecorations` does not add shapes. Photo assignment leaves decoration images on the seed. The log line is `decorations kept from the seed`, and this run removed 0 decorations. Typography, palette, and photographs are still rewritten.

`analyzeDeck.js` fails a content-area element that has a gradient, a box shadow, or a complex SVG path (curves, or a long command list). A full-bleed background, or an element already marked as decoration, is exempt.

## The 11 roles

The saved deck used every role, in order:

| Slide | Role | Seed slide | Geometry |
|---|---|---|---|
| 1 | Cover | geometric-history-of-graphic-design-slides / slide-1 | Title slide |
| 2 | Contents | modern-geometric-music-lesson-plan / slide-6 | Two-column text |
| 3 | About | modern-geometric-music-lesson-plan / slide-9 | Two-column text |
| 4 | Problem | red-minimalist-company-profile-presentation / slide-3 | Two-column text |
| 5 | Solution | geometric-history-of-graphic-design-slides / slide-2 | Features |
| 6 | Proof | geometric-history-of-graphic-design-slides / slide-9 | Data/Stats |
| 7 | Market | red-minimalist-company-profile-presentation / slide-9 | Two-column text |
| 8 | Model | geometric-history-of-graphic-design-slides / slide-4 | Features |
| 9 | People | geometric-history-of-graphic-design-slides / slide-3 | Full-image |
| 10 | Next | geometric-history-of-graphic-design-slides / slide-5 | Features |
| 11 | Close | geometric-history-of-graphic-design-slides / slide-17 | CTA |

## Copy

Brand line: `Nova Solutions: Corporate Pitch Deck`. No em dash.

No rewritten line contains an em dash, a second sentence, or a trailing full stop. No single line is longer than 12 words. Examples: `Nova Solutions: AI for business efficiency`, `Impact of Nova Solutions AI`, `Discussing AI's impact on business`.

Slide totals still go past 25 words where the seed has many boxes. Solution is 38 words across 14 lines, Proof is 45 across 15, Next is 54 across 15. Those extra lines are short labels the geometry already had (`NS: Introduction`, `AI Design`). The writer does not delete boxes.

Bare figures stayed bare. Proof still reads `35%`, `67%`, `79%`, because each original string was a one-word number. The metric sentence pattern is in the prompt, and it is not applied to a one-word label.

## Score

The third attempt scored 18 (2 of 11 slides passed). Eight slides failed `complex svg`. The paths are in the content area of the seeds, so they are the signature geometry this change keeps. The new export check flags them, which is why a deck that used to clear 80 now sits under it. Slide 1 also failed text overlap. Slide 11 failed the vision check as washed out. Slides 7 and 9 passed geometry.

The first attempt, before the retry threw those seeds out, scored 64 (7 of 11) on a different set of Corporate seeds and had the same 11 roles. It was overwritten by the later attempts.
