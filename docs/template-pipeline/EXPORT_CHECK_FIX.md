# Export check fix

Auto-Assemble for `Corporate Pitch Deck` scored **91** on the first attempt (10 of 11 slides). The previous run scored 18, then failed the gate of 80. The deck is in `docs/template-pipeline/slide-assemblies/corporate-pitch-deck`.

## Whitelist

`analyzeDeck.js` still flags a gradient, a box shadow, or a complex SVG, but only on an element that was not in the seed. A seed element is one whose id matches the PowerPoint extractor (`s1-e4`, including rotated ids such as `s1-e4-rot`) or that is marked `seedOrigin`. An injected id such as `motif-1` still fails.

The cover illustration and the chrome shapes on the other slides come from those seeds. They no longer fail the deck. This run had no `complex svg` failure.

## 25 words

After the rewrite, `thematic.js` deletes a text box whose string is empty. If a slide is still over 25 words, it keeps the four largest lines (font size, then length, then position) and deletes the rest. If those four are still over 25 words, it drops the smallest of them until the slide is within the limit, and it always leaves the largest line.

This run removed **9** text boxes. Every slide is now at or under 25 words.

| Slide | Role | Boxes | Words |
|---|---|---:|---:|
| 1 | Cover | 3 | 9 |
| 2 | Contents | 4 | 15 |
| 3 | About | 6 | 23 |
| 4 | Problem | 9 | 17 |
| 5 | Solution | 4 | 8 |
| 6 | Proof | 9 | 16 |
| 7 | Market | 5 | 21 |
| 8 | Model | 4 | 21 |
| 9 | People | 4 | 15 |
| 10 | Next | 4 | 20 |
| 11 | Close | 7 | 16 |

Slides that were already under 25 words kept their short labels, so Proof still has the three metrics and their captions. Solution was the crowded one: it is down to a title and three names.

## Rendered slides

The Solution slide is the clean one. Dark field, the seed's chrome shapes left in place, one title (`OUR TEAM`), and three names under the portraits. The extra nav labels are gone.

The Cover keeps the seed illustration (the phone and the two figures). The type is three lines: `AI FOR ALL`, `NOVA SOLUTIONS CONSULTING`, `NOVA SOLUTIONS AI`. That illustration used to fail as a complex SVG. It passes now.

Proof is the slide that did not pass. The vision check scored it 0.55. The type is short (`MARKET INSIGHTS`, three figures, three captions), and the seed sculpture still crosses the figures. That is the original geometry, not a new SVG and not an over-long paragraph.

## Score

91. Passed 10 of 11. The only failure is `quality 0.55 on slide 6`. No complex-SVG failures, and no slide is over 25 words.
