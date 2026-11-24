"""Synthesise the key taps and mouse clicks and place them on the video's events.

Event times come from the film's internal timeline (src/Film.tsx) and are mapped through the same
SYNC table to output frames, so every sound lands on the frame where it happens on screen.
Writes audio/sfx.wav (48 kHz stereo float).

    pip install numpy scipy soundfile
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

HERE = Path(__file__).parent
SR, FPS = 48000, 30
grid = json.load(open(HERE / "grid.json"))
BEAT = grid["P"] * FPS                       # frames per beat
N = int(grid["beats"] * grid["P"] * SR)      # samples in the video

# [internal frame, beat] — keep in sync with SYNC in src/Film.tsx
SYNC = [(0, 0), (168, 12), (230, 16), (300, 20), (330, 22), (349, 24), (400, 27), (432, 29),
        (482, 32), (560, 38), (628, 41), (664, 43), (700, 45), (736, 47), (780, 49), (804, 51), (870, 56)]


def out_seconds(i):
    for (a, ba), (b, bb) in zip(SYNC, SYNC[1:]):
        if a <= i <= b:
            return (ba + (bb - ba) * (i - a) / (b - a)) * BEAT / FPS
    raise ValueError(i)


rng = np.random.default_rng(7)


def bandpass(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)


def key(heavy=False):
    """A soft key tap: filtered noise click + small low thump. Heavy = Space / Tab / Enter."""
    n = int(SR * (0.07 if heavy else 0.045))
    t = np.arange(n) / SR
    click = bandpass(rng.standard_normal(n), 1800, 6500) * np.exp(-t / (0.007 if heavy else 0.005))
    thump = np.sin(2 * np.pi * (115 if heavy else 175) * rng.uniform(.93, 1.07) * t) * np.exp(-t / (0.022 if heavy else 0.013))
    s = click * 0.55 + thump * (0.6 if heavy else 0.35)
    return s / np.abs(s).max() * rng.uniform(.8, 1.0) * (1.0 if heavy else .85)


def mouse():
    """Mouse press + release, ~75 ms apart."""
    def tick(f0):
        n = int(SR * .012)
        t = np.arange(n) / SR
        return bandpass(rng.standard_normal(n), 2500, 9000) * np.exp(-t / .0012) + np.sin(2 * np.pi * f0 * t) * np.exp(-t / .003) * .4
    a, b = tick(1500), tick(1250) * .6
    gap = int(SR * .075)
    s = np.zeros(gap + len(b))
    s[:len(a)] += a
    s[gap:gap + len(b)] += b
    return s / np.abs(s).max() * .9 * 10 ** (5 / 20)   # +5 dB so clicks read over hi-hats


# (kind, internal frame) — matches the typing / clicks in src/Film.tsx
events = [("mouse", 168), ("mouse", 395.75),
          ("key", 199), ("key", 206.75), ("heavy", 222.25)]                       # y, t, Tab
events += [("heavy" if c == " " else "key", 238.7 + 4.375 * i) for i, c in enumerate("lofi house mix")]
events += [("heavy", 300), ("key", 330), ("key", 345)]                            # Enter, Esc, g

L, R = np.zeros(N), np.zeros(N)
for kind, f in events:
    i0 = int(out_seconds(f) * SR)
    s = mouse() if kind == "mouse" else key(kind == "heavy")
    pan = rng.uniform(-.15, .15)
    e = min(N, i0 + len(s))
    L[i0:e] += s[:e - i0] * (1 - pan)
    R[i0:e] += s[:e - i0] * (1 + pan)

sf.write(HERE / "sfx.wav", np.stack([L, R], 1) * 0.5, SR, subtype="FLOAT")
print(f"{len(events)} sounds → audio/sfx.wav")
