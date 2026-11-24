#!/bin/bash
# Cut the track section, mix the clicks ~7 dB under it, normalise to about -14 LUFS (YouTube's level).
# Needs ffmpeg and python3. Run after analyse_beats.py and make_sfx.py.
set -e
cd "$(dirname "$0")"
read T0 DUR < <(python3 -c 'import json;g=json.load(open("grid.json"));print(g["t0"], g["beats"]*g["P"])')
FADE_START=$(python3 -c "print($DUR - 1.6)")

ffmpeg -v error -ss "$T0" -t "$DUR" -i manteca-funky-lowlives-remix.mp3 \
  -af "afade=t=in:d=0.06,afade=t=out:st=$FADE_START:d=1.6" -ar 48000 -y music.wav

ffmpeg -v error -i music.wav -i sfx.wav -filter_complex \
  "[1:a]volume=-7dB[s];[0:a][s]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[a]" \
  -map "[a]" -ar 48000 -c:a pcm_s16le -y mix.wav

echo "audio/mix.wav ready (${DUR}s)"
