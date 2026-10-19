"""
Score a deck with the LAION improved aesthetic predictor (CLIP ViT-L/14 + MLP).

    python scripts/score_aesthetics.py path/to/deck.json
    python scripts/score_aesthetics.py --png path/to/slide.png

Prints {"slide_scores": [...], "deck_mean": float, "deck_min": float} on stdout.
Rendering failures and model errors go to stderr. The process exits 1 on failure
so the caller can treat scoring as non-fatal.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")

import torch
import torch.nn as nn
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
from transformers.utils import logging as transformers_logging

transformers_logging.disable_progress_bar()
transformers_logging.set_verbosity_error()

ROOT = Path(__file__).resolve().parents[1]
WEIGHT_URL = "https://github.com/christophschuhmann/improved-aesthetic-predictor/raw/main/sac%2Blogos%2Bava1-l14-linearMSE.pth"
WEIGHT = ROOT / "evaluations" / "preferences" / "models" / "sac+logos+ava1-l14-linearMSE.pth"
CLIP_ID = "openai/clip-vit-large-patch14"
SOFFICE_CANDIDATES = [
    r"C:\Program Files\LibreOffice\program\soffice.com",
    r"C:\Program Files\LibreOffice\program\soffice.exe",
]


class MLP(nn.Module):
    def __init__(self, input_size):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, 1024),
            nn.Dropout(0.2),
            nn.Linear(1024, 128),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.Dropout(0.1),
            nn.Linear(64, 16),
            nn.Linear(16, 1),
        )

    def forward(self, x):
        return self.layers(x)


def find_tool(names, extra):
    for name in names:
        found = shutil.which(name)
        if found:
            return found
    for path in extra:
        if Path(path).exists():
            return path
    return None


def ensure_weight():
    if WEIGHT.exists() and WEIGHT.stat().st_size > 1000000:
        return WEIGHT
    WEIGHT.parent.mkdir(parents=True, exist_ok=True)
    print("downloading aesthetic head", file=sys.stderr)
    urllib.request.urlretrieve(WEIGHT_URL, WEIGHT)
    return WEIGHT


def load_models():
    device = "cpu"
    clip = CLIPModel.from_pretrained(CLIP_ID)
    processor = CLIPProcessor.from_pretrained(CLIP_ID)
    clip.eval()
    head = MLP(768)
    state = torch.load(ensure_weight(), map_location=device, weights_only=True)
    if any(key.startswith("layers.") for key in state):
        head.load_state_dict(state)
    else:
        head.layers.load_state_dict(state)
    head.eval()
    return clip, processor, head


def normalized(embedding):
    norm = torch.linalg.norm(embedding, dim=-1, keepdim=True).clamp_min(1e-12)
    return embedding / norm


def image_features(output):
    if torch.is_tensor(output):
        return output
    if hasattr(output, "pooler_output") and output.pooler_output is not None:
        return output.pooler_output
    if hasattr(output, "image_embeds") and output.image_embeds is not None:
        return output.image_embeds
    raise RuntimeError("CLIP did not return image features")


def score_image(path, clip, processor, head):
    image = Image.open(path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = normalized(image_features(clip.get_image_features(**inputs)).float())
        prediction = head(features)
    return float(prediction.view(-1)[0].item())


def score_images(paths, clip, processor, head):
    scores = []
    total = len(paths)
    for index, path in enumerate(paths, start=1):
        scores.append(score_image(path, clip, processor, head))
        if index == 1 or index == total or index % 10 == 0:
            print("scored " + str(index) + "/" + str(total), file=sys.stderr)
    return scores


def render_deck(deck_path, soffice, pdftoppm):
    work = Path(tempfile.mkdtemp(prefix="aesthetic-"))
    svg_dir = work / "svg"
    subprocess.run(
        ["node", str(ROOT / "scripts" / "write_deck_svgs.js"), str(deck_path), str(svg_dir)],
        check=True,
        capture_output=True,
        text=True,
    )
    svgs = sorted(svg_dir.glob("*.svg"))
    profile = (work / "lo-profile").as_posix()
    subprocess.run(
        [
            soffice,
            "-env:UserInstallation=file:///" + profile,
            "--headless",
            "--norestore",
            "--convert-to",
            "pdf",
            "--outdir",
            str(work),
            *[str(svg) for svg in svgs],
        ],
        check=True,
        capture_output=True,
    )
    pngs = []
    for svg in svgs:
        pdf = work / (svg.stem + ".pdf")
        if not pdf.exists():
            raise RuntimeError("LibreOffice did not write a PDF for " + svg.name)
        prefix = work / svg.stem
        subprocess.run(
            [pdftoppm, "-png", "-scale-to-x", "1600", "-scale-to-y", "900", "-singlefile", str(pdf), str(prefix)],
            check=True,
            capture_output=True,
        )
        png = work / (svg.stem + ".png")
        if not png.exists():
            found = list(work.glob(svg.stem + "*.png"))
            if not found:
                raise RuntimeError("pdftoppm did not write a PNG for " + svg.name)
            png = found[0]
        pngs.append(png)
    return pngs, work


def summarize(scores):
    return {
        "slide_scores": [round(score, 4) for score in scores],
        "deck_mean": round(sum(scores) / len(scores), 4) if scores else None,
        "deck_min": round(min(scores), 4) if scores else None,
    }


def main():
    args = sys.argv[1:]
    pngs = []
    cleanup = None
    if not args:
        print("usage: python scripts/score_aesthetics.py deck.json", file=sys.stderr)
        return 1
    try:
        clip, processor, head = load_models()
        if args[0] == "--png":
            pngs = [Path(path) for path in args[1:]]
        else:
            soffice = find_tool(["soffice.com", "soffice"], SOFFICE_CANDIDATES)
            pdftoppm = find_tool(["pdftoppm", "pdftoppm.exe"], [])
            if not soffice or not pdftoppm:
                raise RuntimeError("soffice and pdftoppm are required to render a deck")
            pngs, cleanup = render_deck(Path(args[0]), soffice, pdftoppm)
        scores = [score_image(path, clip, processor, head) for path in pngs]
        print(json.dumps(summarize(scores)))
        return 0
    except Exception as error:
        print(str(error), file=sys.stderr)
        return 1
    finally:
        if cleanup and cleanup.exists():
            shutil.rmtree(cleanup, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
