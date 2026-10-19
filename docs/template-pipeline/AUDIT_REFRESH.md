# Audit refresh

The ten Harbor decks (seeds 1–10, the same brief as the decoration preview) were measured with `analyzeDeck(readDeck())` from `services/templatePipeline/audit/`. That is the measurement `runAudit.js` uses. The reference and before columns are the original audit means. Gap closed is `(after − before) / (reference − before)`.

| Dimension | Reference | Before (audit) | After (this run) | Gap closed |
|---|---|---|---|---|
| Decoration per content slide | 4.7 | 2.0 | 5.8 | 142% |
| Distinct motifs per content slide | 2.6 | 0.7 | 4.3 | 188% |
| Molecule types per deck | 5.7 | 2.1 | 3.7 | 44% |
| Photos per deck | 20.4 | 1.5 | 8.7 | 38% |
| Treated images % | 41% | 24% | 40% | 95% |
| Slides with overlap % | 51% | 1% | 82% | 161% |
| Slides with bleed % | 31% | 0% | 0% | 0% |
| Imperfections per slide | 1.85 | 0.38 | 1.05 | 46% |

Each deck is 6 slides, 60 slides in total. Photos are 9, 9, 8, 9, 9, 8, 9, 9, 8, 9.

## Below 50% — gate cleared, target missed

- **Molecule types per deck (44%).** Mean 3.7 types, reference 5.7. Decoration density is up; the vocabulary of components is not.
- **Photos per deck (38%).** 8.7 against a reference of 20.4. The count moved, and it is still a short deck.
- **Slides with bleed (0%).** Still none. The audit counts an element drawn past the canvas edge. Boxes stay inside 1600×900, so a flush edge does not register.
- **Imperfections per slide (46%).** 1.05 against 1.85. Higher than the original 0.38, short of the reference.

Decoration count, motif variety, treated images, and overlap are at or past the reference mean. Those four are not the next build.
