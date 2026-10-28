# Pipeline merge — Phase 4f-1 close-out

Offline. No intentional text-model calls for the proof replays (`textModelCalls: 0`).

---

## 1. Gate-fixed replay

Replayed stored `proof-4f1-a` / `proof-4f1-b` under the entity-decoding pptx gate into:

| out | deck.qa | textModelCalls |
| --- | --- | ---: |
| `docs/template-pipeline/composer/proof-4f1-a-replay/` | **score 100** (9/9), failures `[]` | **0** |
| `docs/template-pipeline/composer/proof-4f1-b-replay/` | **score 100** (11/11), failures `[]` | **0** |

Close-title `Let&apos;s` / agenda `&amp;` mismatches are gone.

---

## 2. Narrative band in `validatePlan`

APS roles (About / Problem / Solution) that are **inserted** or **relocated**:

- after Contents (inserts land at band start — typically index **2**)
- before the first Proof/Market
- never after Model / People / Next

Recorded as fallbacks:

- inserts: `plan.aps` with `used: "About@2"` and reason mentioning the narrative band
- moves: `plan.narrativeOrder` with reason  
  `narrative roles after Contents and before Proof/Market; never after Model/People/Next`

Length pads that add About also use the narrative insert index.

Replay now re-applies `validatePlan` and remaps index-keyed copy (`remapCopyToPlan`) so stored decks pick up the order fix without new model calls.

### `composer.test.js`

- Missing About → inserted at index 2 (`About@2` fallback).
- About after Next → moved before Proof; `plan.narrativeOrder` recorded.

### Second replay — new plan order

**4f1-a-replay** (moved trailing About from after Model → before Proof):

```
0 Cover/cover/split
1 Contents/agenda/numbered-list
2 About/statement/with-kicker
3 Problem/split-copy/photo-left
4 Solution/split-copy/photo-right
5 About/statement/left          ← was after Model; narrativeOrder About@7 → 5
6 Proof/big-number/centered
7 Model/process/four-step
8 Close/close/photo
```

`deck.qa` **100**, `textModelCalls` **0**.

**4f1-b-replay** (moved About from after Next → before Proof):

```
0 Cover/cover/split
1 Contents/agenda/two-column
2 Problem/statement/with-kicker
3 Solution/split-copy/photo-right
4 About/split-copy/photo-left   ← was after Next; narrativeOrder About@9 → 4
5 Proof/big-number/left
6 Model/process/four-step
7 Market/stat-row/three-up
8 People/team-grid/four
9 Next/statement/with-kicker
10 Close/close/plain
```

`deck.qa` **100**, `textModelCalls` **0**.

---

## 3. Tests

```
qaLoop test passed
semanticFilter test passed
chooseLayout test passed
dead code test passed
manualQa test passed
composer.test passed
safeRm test passed
generateTemplateShape test passed
catalogGolden test passed (stripped 10, unstripped 10)
```

No file named `assembleDeck.js` or `composeDeck.js`.

---

Stop.
