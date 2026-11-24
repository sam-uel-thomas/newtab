"""Soundtrack for the Tour film (src/Tour.tsx): the opening of the track, with quiet whooshes,
pops, key taps and mouse clicks placed on the frames where things happen on screen.

Needs ffmpeg and numpy only.  Writes audio/tour-mix.wav (48 kHz stereo, about -14 LUFS).
If you move a moment in the `T` table of Tour.tsx, move it here too.
"""
import subprocess
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
TRACK = HERE / "grazing-in-the-grass.mp3"
START = 0.0          # seconds into the track
SR, FPS, FRAMES = 48000, 30, 1154
# the music fades from the beat where the outro text leaves (35.73 s) to the beat at 38.29 s,
# just before the grid goes to black
FADE_FROM, FADE_TO = 35.73, 38.29
DUR = FRAMES / FPS
SFX_DB = -9          # effects bus relative to the music: present, never loud
rng = np.random.default_rng(11)

# ── the same moments as T in Tour.tsx (output frames) ──
T = dict(arrive=0, pushIn=108, click=180, y=186, t=191, space=204, chip=206, query=216,
         erase=290, select=316, chipOut=328, g=354, list=356, down1=372, down2=384, esc=412,
         pullBack=418, times=580, timeStep=38, shortcut=830, slide=836, exit=954)
QUERY = "Hugh Masekela"
TYPE_RATE, ERASE_RATE = 3, 1.6   # frames per character, as in Tour.tsx


def band(x, lo, hi):
    """Band-pass by FFT with soft edges (fine for short one-shots)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    w = np.clip((f - lo * 0.8) / (lo * 0.2), 0, 1) * np.clip((hi * 1.25 - f) / (hi * 0.25), 0, 1)
    return np.fft.irfft(X * w, len(x))


def norm(s, peak):
    return s / (np.abs(s).max() + 1e-9) * peak


def whoosh(d=0.6, rise=True, peak=0.6):
    """Air moving past: bands of noise that bloom one after another, panned across."""
    n = int(SR * d)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    bands = [(180, 450), (450, 1000), (1000, 2200), (2200, 4500), (4500, 9000)]
    out = np.zeros(n)
    for i, (lo, hi) in enumerate(bands):
        k = i if rise else len(bands) - 1 - i
        c = d * (0.32 + 0.09 * k)
        out += band(noise, lo, hi) * np.exp(-((t - c) / (d * 0.22)) ** 2) * (1.0 - 0.12 * i)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    s = norm(out * env, peak)
    pan = np.linspace(-0.45, 0.45, n) if rise else np.linspace(0.45, -0.45, n)
    return np.stack([s * (1 - pan), s * (1 + pan)], 1)


def pop(f0=620, f1=940, peak=0.5):
    """A soft, rounded pop for things that appear (chip, list)."""
    n = int(SR * 0.09)
    t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(np.linspace(f0, f1, n)) / SR
    s = np.sin(ph) * np.exp(-t / 0.025) + band(rng.standard_normal(n), 2000, 6000) * np.exp(-t / 0.002) * 0.25
    s = norm(s, peak)
    return np.stack([s, s], 1)


def key(heavy=False, peak=0.85):
    n = int(SR * (0.07 if heavy else 0.045))
    t = np.arange(n) / SR
    click = band(rng.standard_normal(n), 1800, 6500) * np.exp(-t / (0.007 if heavy else 0.005))
    thump = np.sin(2 * np.pi * (115 if heavy else 175) * rng.uniform(.93, 1.07) * t) * np.exp(-t / (0.022 if heavy else 0.013))
    s = norm(click * 0.55 + thump * (0.6 if heavy else 0.35), peak * rng.uniform(.8, 1.0) * (1.0 if heavy else .85))
    p = rng.uniform(-.15, .15)
    return np.stack([s * (1 - p), s * (1 + p)], 1)


def mouse(peak=0.95):
    def tick(f0):
        n = int(SR * .012)
        t = np.arange(n) / SR
        return band(rng.standard_normal(n), 2500, 9000) * np.exp(-t / .0012) + np.sin(2 * np.pi * f0 * t) * np.exp(-t / .003) * .4
    a, b = tick(1500), tick(1250) * .6
    gap = int(SR * .075)
    s = np.zeros(gap + len(b))
    s[:len(a)] += a
    s[gap:gap + len(b)] += b
    s = norm(s, peak)
    return np.stack([s, s], 1)


# ── what happens when ──
events = [
    (T["arrive"] + 2, whoosh(0.9, peak=0.45)),
    (T["pushIn"], whoosh(0.7, peak=0.5)),
    (T["click"], mouse()),
    (T["y"], key()), (T["t"], key()), (T["space"], key(True)),
    (T["chip"], pop()),
    *[(T["query"] + TYPE_RATE * i, key(c == " ")) for i, c in enumerate(QUERY)],
    *[(T["erase"] + ERASE_RATE * i, key(peak=0.55)) for i in range(len(QUERY))],
    (T["select"], key()),
    (T["chipOut"], key()), (T["chipOut"] + 2, whoosh(0.4, rise=False, peak=0.35)),
    (T["g"], key()), (T["list"], pop(520, 760, 0.35)),
    (T["down1"], key()), (T["down2"], key()), (T["esc"], key()),
    (T["pullBack"], whoosh(0.7, rise=False, peak=0.45)),
    # a soft tick each time the greeting moves through the day
    *[(T["times"] + i * T["timeStep"] + 8, pop(480 + 40 * i, 640 + 50 * i, 0.22)) for i in range(6)],
    # the slide across to the private window's Space
    (T["shortcut"], key(True)), (T["slide"], whoosh(1.3, peak=0.6)),
    (T["exit"], whoosh(0.8, rise=False, peak=0.5)),
    (1068, whoosh(0.9, rise=False, peak=0.22)),   # the outro text drifting away
]

n = int(SR * DUR)
sfx = np.zeros((n, 2))
for frame, s in events:
    i0 = int(frame / FPS * SR)
    e = min(n, i0 + len(s))
    sfx[i0:e] += s[:e - i0]

# ── the music ──
raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(START), "-t", str(DUR), "-i", str(TRACK),
                      "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
music = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
music = np.pad(music, ((0, max(0, n - len(music))), (0, 0)))[:n]
t = np.arange(n) / SR
out = np.clip((t - FADE_FROM) / (FADE_TO - FADE_FROM), 0, 1)
fade = np.clip(t / 0.08, 0, 1) * 0.5 * (1 + np.cos(np.pi * out))   # smooth (cosine) fade-out
music *= fade[:, None]

mix = music + sfx * 10 ** (SFX_DB / 20) * np.abs(music).max()
subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-af", "loudnorm=I=-14:TP=-1:LRA=11", "-ar", str(SR), "-c:a", "pcm_s16le", "-y",
                str(HERE / "tour-mix.wav")], input=mix.astype(np.float32).tobytes(), check=True)
print(f"{len(events)} sounds → audio/tour-mix.wav ({DUR:.0f}s)")
