# Showcase video

A 32-second film of the new tab page, built with [Remotion](https://www.remotion.dev) and cut to
*Manteca (Funky Lowlives Remix)* at 105 bpm.

The page isn't screen-recorded — it's rebuilt in React (`src/Film.tsx`) so every frame is driven by
the frame number: the drifting glow, the cursor, the typing, the chip, the list, the greeting changes.

## How it's put together

- **`src/Film.tsx`** — the whole film. It's authored on an *internal* timeline (frames 0–870); the
  `SYNC` table warps it so key moments land on beats of the track:

  | Beat | Moment |
  |---|---|
  | 0 | window arrives (in the breakdown) |
  | 12 | click into search |
  | 14, 14½ | `y`, `t` |
  | 16 | **drop** — the YouTube chip pops |
  | 16½ → | "lofi house mix" typed in 16ths |
  | 20 | Enter |
  | 24 | the shortcut list drops |
  | 27 | Drive chip |
  | 32–38 | cursor hovers the links |
  | 41, 43, 45, 47 | greeting changes through the day |
  | 51 | end card |
  | 56 | end (14 bars) |

- **Cursor** follows quadratic-bezier arcs (control point offset 15% of the distance), eases in and out,
  settles with a tiny overshoot and never fully stops. Shape switches arrow → I-beam → hand like macOS.
- **Toolbar** is drawn at the real Firefox size (1440px window) from a screenshot, then scaled.

## The tour (about 38 s, `src/Tour.tsx`)

A second film covering everything added since: the liquid glow, the rim light on the search bar,
chips springing in and collapsing out, the shortcut list's sliding highlight, link underlines (one
glide over all four), the greeting through the day, the private window slid in like a new Space
(dusky blue, the cheeky greeting, the blue tab icon),
the VPN shield and a simple grid end card. It runs on plain output frames (no beat sync), timed by the `T`
table at the top of the file; `audio/make_tour_audio.py` places the whooshes, pops and clicks on the
same frames, so move a moment in both.

```bash
npm run build:tour   # → out/newtab-tour.mp4 (needs ffmpeg and numpy)
```

The music is the opening of `audio/grazing-in-the-grass.mp3`.

## Run it

```bash
npm install
npm run studio     # live preview / scrub in the browser
npm run build      # render video, build audio, put them together → out/newtab-showcase.mp4
```

The audio steps need `ffmpeg` and Python with `librosa soundfile scipy numpy`
(`pip install librosa soundfile scipy`).

- `npm run render` — video only → `out/video.mp4`
- `npm run audio` — beat grid → click sounds → mix → `audio/mix.wav`

## Changing things

- **Different song:** drop it in `audio/`, update `TRACK` and `START_BEAT` in `analyse_beats.py`,
  set `BEAT` in `src/Film.tsx` to the new frames-per-beat it prints, and adjust `SYNC` if the drop
  isn't 16 beats in.
- **Timing of a moment:** move its beat in `SYNC` (and the same table in `audio/make_sfx.py`).
- **Click volume:** `volume=-7dB` in `audio/mix.sh`.

## Music

The music isn't in this repo — the tracks are © their owners. To build the films, put your own copies in
`audio/` (`manteca-funky-lowlives-remix.mp3` for the showcase, `grazing-in-the-grass.mp3` for the tour)
or point `TRACK` in `analyse_beats.py` / `make_tour_audio.py` at another song. Any `.mp3` in `audio/` is
gitignored.
