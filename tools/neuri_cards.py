"""Neuri's floating card textures: the storyboard's OUTSIDE panel per step -> Assets/Textures/NeuriCard1..6.png.

    python3 tools/neuri_cards.py
"""
import os
import pathlib
import subprocess

import concept_diagrams as cd

OUT = pathlib.Path(__file__).resolve().parent.parent / "Assets" / "Textures"

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = pathlib.Path(os.environ.get("TMPDIR", "/tmp")) / "concept-chrome"
    for i in range(1, len(cd.STEPS5) + 1):
        p = tmp.parent / f"neuri-card-{i}.svg"
        p.write_text(cd.svg(800, 900, cd.outside(i)))
        png = OUT / f"NeuriCard{i}.png"
        subprocess.run([cd.CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={tmp}",
                        "--window-size=800,900", f"--screenshot={png}", p.as_uri()], check=True, capture_output=True)
        print(png)
