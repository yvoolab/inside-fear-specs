"""Neuri's six narration tracks from STEPS5 (en-US-AnaNeural via edge-tts; synthetic voice, not a recording of a child).

    pip install edge-tts && python3 tools/neuri_voice.py   # -> Assets/Narration/Neuri1..6.mp3
"""
import asyncio
import os

import edge_tts

from concept_diagrams import STEPS5

OUT = os.path.join(os.path.dirname(__file__), "..", "Assets", "Narration")


async def main():
    os.makedirs(OUT, exist_ok=True)
    for i, (_, _, _, line) in enumerate(STEPS5, 1):
        await edge_tts.Communicate(line, "en-US-AnaNeural").save(os.path.join(OUT, f"Neuri{i}.mp3"))
        print(f"Neuri{i}.mp3")


asyncio.run(main())
