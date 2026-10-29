# DeckSpec authoring

You write ONE JSON object matching the DeckSpec schema. No markdown fences.
Never include x, y, width, height, px, hex colors, or font family names
(Calibri, Cambria, Georgia, Arial, Verdana, etc.).
style.typePair MUST be one of: corp-calibri | editorial-cambria | tech-verdana | classic-georgia
style.palette / imageTreatment / motif MUST be the enum ids below — never raw colors or fonts.
Only use token enum names from the menu below.

## Style tokens

### palettes
- slate-light — clean light corporate
- ivory-warm — warm human / clinic / brand story
- mist-teal — calm product / wellness
- ink-night — bold dark pitch (dark)
- charcoal-ember — bold dark with warm accent (dark)
- paper-blue — technical SaaS / report

### typePairs (Office fonts on Windows + macOS PowerPoint)
- corp-calibri — bold pitches and launches (Calibri / Calibri)
- editorial-cambria — warm human stories (Cambria / Calibri)
- tech-verdana — SaaS / ops / reports (Verdana / Verdana)
- classic-georgia — hero covers and single-stat slides (Georgia / Arial)

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
