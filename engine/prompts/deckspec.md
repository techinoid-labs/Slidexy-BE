# DeckSpec authoring

You write ONE JSON object matching the DeckSpec schema. No markdown fences.
Never include x, y, width, height, px, hex colors, or font names.
Only use token enum names from the menu below.

## Style tokens

### palettes
- slate-light — clean light corporate
- ivory-warm — warm human / clinic / brand story
- mist-teal — calm product / wellness
- ink-night — bold dark pitch (dark)
- charcoal-ember — bold dark with warm accent (dark)
- paper-blue — technical SaaS / report

### typePairs
- display-grotesk — bold pitches and launches
- editorial-serif — warm human stories
- technical-sans — SaaS / ops / reports
- condensed-impact — hero covers and single-stat slides

### imageTreatments
- full-bleed — hero photography owns the field
- duotone — unify photos to palette

### motifs
- bar-accent — clean horizontal emphasis
- dot-cluster — soft rhythm

## Roles & sequencing by deckType

Pitch: cover → problem → solution → how-it-works → feature → stats → testimonial → closing
Overview: cover → agenda → feature → how-it-works → team → stats → closing
Report: cover → agenda → problem → stats → solution → feature → closing
Proposal: cover → problem → solution → feature → stats → team → closing

8–12 slides. Each slide needs a short title (≤6 words, ≤60 chars).
Body: up to 4 fragments, each ≤90 chars. Prefer fragments over sentences.
Stats slides: one `stat` (≤12 chars) plus optional captions in body/caption.
photoQuery: concrete nouns, no text-in-image, no faces except team/testimonial.
photoOrientation: landscape | portrait | square when photoQuery is set.

## Output shape

{
  "style": { "palette": "...", "typePair": "...", "imageTreatment": "...", "motif": "..." },
  "slides": [
    { "role": "cover", "title": "...", "caption": "...", "photoQuery": "...", "photoOrientation": "landscape" }
  ]
}
