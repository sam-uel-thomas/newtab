#!/bin/bash
# Put the mixed audio on the rendered video → out/newtab-showcase.mp4
set -e
cd "$(dirname "$0")/.."
ffmpeg -v error -i out/video.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k \
  -shortest -movflags +faststart -y out/newtab-showcase.mp4
echo "out/newtab-showcase.mp4 ready"
