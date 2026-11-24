# newtab

A calmer new tab page for Firefox — a slow, grainy orange glow, a greeting that knows what time it is, and a search bar with Raycast-style shortcuts. Plus a matching restyle of Firefox's own toolbar.

One HTML file, no build step, no server, works offline.

## Make your own

Open the **[builder](https://sam-uel-thomas.github.io/newtab/builder/)** (or `builder/index.html` in a clone, straight from your disk) to pick your glow for normal and private windows, your name, your search shortcuts and links, and whether Firefox's toolbar should match. It shows the real page live as you go, then gives you a zip with everything and an installer. You can also share your look as a link.

## What it does

- **Greeting by time of day** — *Good morning*, *Good afternoon*, *Good evening*, *Working late?*, *Still up?* (and *Slow morning* at weekends)
- **Search shortcuts** — type a shortcut and press <kbd>Space</kbd> or <kbd>Tab</kbd> to turn it into a chip:

  | Shortcut | Searches |
  |---|---|
  | `gh` | GitHub |
  | `yt` | YouTube |
  | `m`  | Gmail |
  | `d`  | Google Drive |
  | `w`  | Wikipedia |

  Type a single letter to see matching shortcuts (<kbd>↑</kbd><kbd>↓</kbd> + <kbd>Enter</kbd>, <kbd>Tab</kbd> or click). <kbd>Backspace</kbd> twice removes a chip, <kbd>Esc</kbd> clears. Web addresses open directly; anything else goes to Google.
- **Keys** — <kbd>/</kbd> focuses search, <kbd>⌥/Alt</kbd>+<kbd>1–9</kbd> open the links.
- **Toolbar restyle** (`firefox/userChrome.css`) — warm charcoal to match the page, tidied tabs on an 8pt grid, no reload button, no search-engine dropdown.

## Setup from a clone

Made a zip in the builder? Follow the steps it shows (or its `README.txt`) instead.

Clone it somewhere permanent, quit Firefox, then run the installer for your machine.

**macOS**
```bash
git clone https://github.com/sam-uel-thomas/newtab.git
cd newtab && ./install.sh
```

**Windows** (Administrator PowerShell)
```powershell
git clone https://github.com/sam-uel-thomas/newtab.git
cd newtab
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

The installer:
1. adds `autoconfig.js` / `autoconfig.cfg` to Firefox's install folder, pointing the new tab page and homepage at `index.html` in your clone, and giving the page focus (instead of the address bar) when a tab opens;
2. puts `userChrome.css` in your profile's `chrome/` folder (linked on macOS, copied on Windows);
3. adds the prefs from `firefox/user.js` to your profile.

## Updating

`git pull`. The page updates straight away. On macOS the toolbar styling is linked so it updates too; on Windows re-run `install.ps1`.

**After a Firefox update** the autoconfig files in Firefox's install folder can be wiped — if the new tab page goes back to Firefox's default, run the installer again.

## Customising

Use the builder, or edit the `NEWTAB` settings block at the top of `index.html` by hand:

- `name` — leave it empty for greetings without a name
- `glow` — three colours each for normal and private windows, plus `grain`
- `shortcuts` — `key` is what you type, `search` has `%s` where your search goes, `icon` is a built-in name (`gh yt m d w map`), a `data:image/png` URL, or left out for a letter
- `links` — the sites under the search bar
- Toolbar colours: `--sam-base` and friends at the top of `userChrome.css`; alignment: `--sam-align` and `--sam-fs-pad`

If you change `index.html`, anything in `firefox/` or the installers, run `python3 builder/bundle.py` so the builder picks it up.: `--sam-align` and `--sam-fs-pad` at the top of `userChrome.css`

## Showcase video

`showcase/` is the Remotion project for the 32-second showcase film, cut to the music. See [showcase/README.md](showcase/README.md).

Brand icons from [Simple Icons](https://simpleicons.org) (CC0).

## License

[MIT](LICENSE)
