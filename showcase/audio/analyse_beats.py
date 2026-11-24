"""Find the beat grid for the section of the track the video uses.

Tracks beats with librosa, then fits a straight line through beats START..START+56 so the grid is steady
(the raw tracker steps in ~23 ms hops). Writes audio/grid.json: {"t0": start time (s), "P": seconds per beat}.

For this track (Manteca, Funky Lowlives Remix) the section starts on a downbeat in the breakdown at ~2:08
and the drums drop back in 16 beats later — that's where the YouTube chip pops.

    pip install librosa soundfile scipy
"""
import json
from pathlib import Path

import librosa
import numpy as np

HERE = Path(__file__).parent
TRACK = HERE / "manteca-funky-lowlives-remix.mp3"
START_BEAT = 224   # index of the first beat used (a downbeat in the breakdown)
BEATS = 56         # length of the video in beats (14 bars)

y, sr = librosa.load(TRACK, sr=22050, mono=True)
_, beats = librosa.beat.beat_track(y=y, sr=sr, units="time", tightness=120)

k = np.arange(START_BEAT, START_BEAT + BEATS + 1)
P, t0 = np.polyfit(k - START_BEAT, beats[k], 1)
res = beats[k] - (t0 + P * (k - START_BEAT))
print(f"grid: {60 / P:.2f} bpm, starts {t0:.3f}s, worst beat off by {abs(res).max() * 1000:.0f} ms")
print(f"video length: {BEATS * P:.3f}s = {BEATS * P * 30:.1f} frames at 30fps")

json.dump({"t0": float(t0), "P": float(P), "beats": BEATS}, open(HERE / "grid.json", "w"), indent=2)
