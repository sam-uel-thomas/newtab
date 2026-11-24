#!/bin/bash
# macOS setup — run from the repo:  ./install.sh   (asks for your password to write into Firefox.app)
# Quit Firefox (⌘Q) first. Re-run after a Firefox update if the new tab page disappears.
set -e
REPO="$(cd "$(dirname "$0")" && pwd)"
URL="file://$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$REPO/index.html")"
FF="/Applications/Firefox.app/Contents/Resources"
PROFILE="$(ls -d ~/Library/Application\ Support/Firefox/Profiles/*.default-release 2>/dev/null | head -1)"

[ -d "$FF" ] || { echo "Firefox not found at /Applications/Firefox.app"; exit 1; }
[ -n "$PROFILE" ] || { echo "No *.default-release Firefox profile found — open Firefox once, then re-run."; exit 1; }

echo "New tab page: $URL"
echo "Profile:      $PROFILE"

# 1. autoconfig (new tab + homepage + focus fix)
sudo mkdir -p "$FF/defaults/pref"
sudo cp "$REPO/firefox/autoconfig.js" "$FF/defaults/pref/autoconfig.js"
sed "s#__NEWTAB_URL__#$URL#" "$REPO/firefox/autoconfig.cfg" | sudo tee "$FF/autoconfig.cfg" > /dev/null

# 2. toolbar styling — linked, so `git pull` updates it too
mkdir -p "$PROFILE/chrome"
ln -sf "$REPO/firefox/userChrome.css" "$PROFILE/chrome/userChrome.css"

# 3. preferences (only adds lines that aren't there yet)
touch "$PROFILE/user.js"
grep '^user_pref' "$REPO/firefox/user.js" | while read -r line; do
  grep -qF "$line" "$PROFILE/user.js" || echo "$line" >> "$PROFILE/user.js"
done

echo "Done — open Firefox."
