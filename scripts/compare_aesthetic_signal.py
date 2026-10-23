"""
Scores the 75 balanced reference slides and the Harbor decks with the same model.

    python scripts/compare_aesthetic_signal.py decks-dir out.json
"""

import json
import sys
from pathlib import Path

from score_aesthetics import find_tool, load_models, render_deck, score_images, SOFFICE_CANDIDATES

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "evaluations" / "preferences" / "rendered" / "manifest.json"
PNG_ROOT = ROOT / "evaluations" / "preferences" / "rendered"


def mean(values):
    return sum(values) / len(values) if values else None


def main():
    decks_dir = Path(sys.argv[1])
    out_path = Path(sys.argv[2])
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    reference_paths = [PNG_ROOT / item["png"] for item in manifest["balanced"]]
    missing = [str(path) for path in reference_paths if not path.exists()]
    if missing:
        raise SystemExit("missing reference pngs: " + str(len(missing)))
    soffice = find_tool(["soffice.com", "soffice"], SOFFICE_CANDIDATES)
    pdftoppm = find_tool(["pdftoppm", "pdftoppm.exe"], [])
    if not soffice or not pdftoppm:
        raise SystemExit("soffice and pdftoppm are required")
    clip, processor, head = load_models()
    print("scoring reference", file=sys.stderr)
    reference_scores = score_images(reference_paths, clip, processor, head)
    decks = []
    harbor_scores = []
    for deck_path in sorted(decks_dir.glob("*.json")):
        print("rendering " + deck_path.name, file=sys.stderr)
        pngs, work = render_deck(deck_path, soffice, pdftoppm)
        try:
            scores = score_images(pngs, clip, processor, head)
        finally:
            import shutil
            shutil.rmtree(work, ignore_errors=True)
        harbor_scores.extend(scores)
        decks.append({
            "id": deck_path.stem,
            "slide_scores": [round(score, 4) for score in scores],
            "deck_mean": round(mean(scores), 4),
            "deck_min": round(min(scores), 4),
        })
    reference_mean = mean(reference_scores)
    harbor_mean = mean(harbor_scores)
    payload = {
        "reference_slides": len(reference_scores),
        "harbor_slides": len(harbor_scores),
        "reference_mean": round(reference_mean, 4),
        "harbor_mean": round(harbor_mean, 4),
        "gap": round(reference_mean - harbor_mean, 4),
        "usable": reference_mean >= harbor_mean + 0.3,
        "reference_scores": [round(score, 4) for score in reference_scores],
        "decks": decks,
    }
    out_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "reference_mean": payload["reference_mean"],
        "harbor_mean": payload["harbor_mean"],
        "gap": payload["gap"],
        "usable": payload["usable"],
        "reference_slides": payload["reference_slides"],
        "harbor_slides": payload["harbor_slides"],
    }))


if __name__ == "__main__":
    main()
