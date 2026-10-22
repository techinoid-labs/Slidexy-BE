# Semantic overlap scoring

Geometry now fails text-on-text only when the shared area is more than 40% of the smaller box. Text sitting on a photo is allowed, and so is a shape sitting on a photo. Those slides go to the vision review, which is told to judge the rendered pixels and to pass readable text on a photograph.

Contrast still fails dark text on a dark panel when that text does not sit on a photo. A text box that actually leaves the canvas still fails as bounds.

## Seeds that already had a score

Seventeen seeds were scored again with the prompt “A company overview.” Thirteen rose, two stayed the same, and two fell. Contrast failures on these seeds went from 32 slides to 3. Broken-layout failures went from 57 slides to 31. Twelve slides now fail as text overlap, which is two text boxes covering more than 40% of the smaller box.

| Seed | Before | After |
|---|---:|---:|
| beige-and-brown-minimalist-creative-portfolio-presentation | 90 | 90 |
| black-and-grey-3d-shapes-tech-company-presentation | 87 | 93 |
| black-and-white-minimalist-creative-portfolio-presentation | 60 | 70 |
| black-and-white-minimalist-pitch-deck-presentation | 100 | 100 |
| blue-and-beige-modern-social-media-marketing-presentation | 40 | 60 |
| blue-and-purple-gradient-pitch-deck-presentation | 31 | 50 |
| blue-and-white-modern-business-proposal-presentation | 82 | 91 |
| blue-violet-and-pink-simple-strategy-roadmap-presentation | 42 | 89 |
| dependent-and-independent-variables-lesson-for-middle-school | 40 | 33 |
| first-aid-medicine-life-skills-presentation | 61 | 72 |
| geometric-history-of-graphic-design-slides | 76 | 88 |
| modern-geometric-music-lesson-plan | 85 | 75 |
| personal-trainer-portfolio-black-and-beige-modern-minimal-presentation | 35 | 53 |
| pitch-deck-competitor-analysis-slides | 50 | 65 |
| red-and-purple-3d-modern-background-pitch-deck | 16 | 40 |
| seo-competitor-analysis-slides | 45 | 90 |
| soft-green-and-beige-simple-doodles-product-timeline-presentation | 61 | 84 |

The largest rises are the ones that had been failing contrast or broken layout on editorial layouts: blue-violet 42 to 89, seo 45 to 90, red-and-purple 16 to 40, soft-green 61 to 84.

Modern-geometric-music-lesson-plan fell from 85 to 75 because slide 1 now fails text overlap. Dependent-and-independent fell from 40 to 33. The vision pass also moves between runs, so a small drop is not only the geometry rule.

These now clear the Auto-Select line of 70: the black-and-white creative portfolio (Text-heavy, 70), blue-violet (Corporate, 89), first-aid (Photo-heavy, 72), seo (Photo-heavy, 90), and soft-green (Photo-heavy, 84).

## Seeds scored for the first time in this pass

These had no earlier DNA score. The number in parentheses is a pass that started while the previous curator was still loaded. The final number is the new scorer.

| Seed | First pass | New scorer |
|---|---:|---:|
| brown-and-beige-vintage-watercolor-creative-portfolio-presentation | — | 72 Corporate |
| green-modern-brand-strategy-presentation-10-page | 60 | 70 Text-heavy |
| orange-and-black-geometric-brand-guideline-presentation | 90 | 76 Corporate |
| orange-and-black-modern-pitch-deck-presentation | 30 | 50 Text-heavy |
| purple-and-white-modern-gradient-business-pitch-deck-presentation | 9 | 27 Corporate |
| purple-and-white-modern-startup-pitch-deck-presentation | 10 | 10 Text-heavy |
| purple-modern-creative-portfolio-presentation | 80 | 90 Corporate |
| red-and-black-bold-modern-digital-marketing-presentation | 40 | 50 Corporate |
| red-black-neon-cinema-presentation | 70 | 100 Text-heavy |
| red-minimalist-company-profile-presentation | 60 | 60 Corporate |
| white-minimal-photography-portfolio-presentation | 40 | 80 Corporate |
| yellow-and-blue-illustrative-modern-geometric-health-medical-presentation | 100 | 100 Corporate |

Purple-modern still fails bounds on slide 6, and red-minimalist still fails bounds on slide 10. Those boxes leave the canvas. The overlap rule does not waive that.
