# AstroMeow: developer notes

An educational space game for kids aged 7-12. The UI and the content are in Polish; the code and these docs are in English. Astro the cat is called **Astruś** in the game.

## Running

```bash
cloudflared tunnel --url http://127.0.0.1:8085   # optional: public URL

bash run.sh          # build + server + SQLite database, Ctrl+C stops it
bash run.sh -d       # the same in the background   (stop | status | logs)
```

Details, commands and the database: see [Visit counter](#visit-counter) below.

**Developer mode** (only on a server started with `--dev`, e.g. `DEV_MODE=1 bash run.sh`; without it `?dev=` is ignored): `index.html?dev=flappy` (or `shooter`, `catch`, `lander`, `pack`) starts the chosen mini-game right away, skipping the intro and the missions. Optional `&diff=easy|mid|hard`. Nothing is saved (saving and the leaderboard are off), TRY AGAIN replays the game, NEXT goes to Missions (refresh the page to start the game again). Unknown key: the list of keys is printed with `console.warn` and the game starts normally.

## Structure

```
index.html          page skeleton (loads the files in order)
run.sh              build + start/restart of the server with the counter (bash run.sh | -d | stop | status | logs)
build.py            bundles the whole project into a single dist/astromeow.html
counter/            visit counter: server.py (server + SQLite), live.html, counter.sh (reset/stats/test)
css/                styles, in loading order
  01-base           palette (:root), navigation, buttons, cards
  02-cat            the cat and its skins
  03-quiz           question screen and hearts
  04-map            MeowMission trail, planets
  05-tutorial       tutorial pop-ups
  06-effects        confetti, toast, animations
  07-base-game      the base (planets and buildings)
  08-minigames      mini-games and rocket packing
js/                 classic scripts (shared scope, the order matters)
  01-config         keys, saving
  02-layout         scaling (fit) for a portrait 9:16 laptop and a phone
  03-cat            SVG cat / frames from cat/, skins
  04-reactions      brainrot-style reactions to answers
  00-data           loading config/*.json (DATA)
  05-questions      builds MISSIONS/DIFFS from config/missions.json (the content is in JSON, not here)
  06-base-data      planets, buildings, add-ons
  07-state          game state, saving, base economy
  08-ui, 09-start, 10-home, 11-trail   screens: start, menu, mission trail
  12-quiz           quiz, hearts, golden life
  13-minigames, 14-pack   mini-games (canvas) and rocket packing
  15-results        mini-game result / mission report
  16-base, 17-shop, 18-tutorial, 19-badges   base, shop, tutorials, badges
  20-router, 21-start-loop   click actions and app start
  22-counter        reporting a visit to the counter (POST /api/hit)
  23-facts          the Facts screen ("Ciekawostki" tab), styles in css/09-facts.css
  24-sound          Web Audio sounds (click, right/wrong, result, Astruś' meow); mute: 🔊 on the home screen or sfxToggle()
cat/                (optional) cat frames: idle_1.png … cheer_3.png or idle.gif …
```

## Base and player save

- Resources (keys in the code unchanged): `wiedza` = **Oxygen** 🫁, `czesci` = **Energy** ⚡, `meteo` = **Water** 💧. Names and icons: `RES` in `js/06-base-data.js`.
- Planets in order: Moon, Mars, Mercury, then further locations on the Moon (Sea of Tranquility), Mars (Valles Marineris) and Mercury (North Pole): `PLANETS` in `js/06-base-data.js`.
- After a quiz and a mini-game, NEXT leads to the **Base**. Every time the player enters the Base, an A/B safety question appears (`config/safety.json`): a right answer gives +20% of the resource, a wrong one −10%. Each question has a `res` field, the resource it concerns.
- **Resetting old bases:** bump `BASE_VER` in `js/01-config.js`. Every player gets a clean base on their next visit, while mission progress, stars and skins stay.
- **Resetting the whole save on a device:** append `?reset=1` to the page URL and confirm.

- **"Latest from NASA" panel in Facts** (`counter/nasa.py`, `loadNasa()` in `js/23-facts.js`): solar flare, geomagnetic storm and CME from NASA DONKI, plus the Astronomy Picture of the Day (APOD). The server refreshes DONKI in the background every 5 min (APOD every hour, and with `DEMO_KEY` everything every 30 min because of the rate limit; change with `--nasa-every SEC`). The in-game panel refreshes itself every 5 min while the player stays in Facts (`/api/nasa`, cache in `counter/data/nasa-cache.json`), so players never hit the API directly. Key: `NASA_API_KEY=... bash run.sh` (free at https://api.nasa.gov; without it `DEMO_KEY` is limited to 30 requests per hour per address and often returns 429). With no data the panel is hidden, and offline the game shows the last remembered data. Tests: `python3 -m unittest tests/test_nasa.py`.
- **Developer account:** players whose nickname is passed with `--dev-nick` get developer mode (`?dev=`, `?demo=1`, all planets unlocked) also on a server without `--dev`. Note: matching is by nickname, so anyone who picks `Dylu` gets it too. By default nobody has it. Pass it with `python3 counter/server.py serve --dev-nick Dylu` (repeatable) or `DEV_NICKS="Dylu" bash run.sh`. Narrow it to a single account with `Dylu#8054`.
- **Demo for recording:** on a server with `--dev` (`DEV_MODE=1 bash run.sh`) open `/?demo=1`: it loads a sample state (completed missions, resources, built planets, everything unlocked). Refreshing without `?demo=1` keeps that state. The first time you still have to enter a nickname.
- **3D building models** (`js/29-models3d.js`, three.js r177 in `vendor/three.min.js`, MIT licence): every building has its own solid, rendered once to a PNG in a shared WebGL context. Without WebGL a plain icon is shown. The A/B question is rate-limited to 1 per 45 s (`SAFE_COOLDOWN` in `js/16-base.js`).

## Common changes

- New stages and questions: `config/missions.json`. Lessons and tutorials: `config/tutorials.json`, no code needed. Guide: [ADDING-A-STAGE.md](ADDING-A-STAGE.md). `python3 build.py` validates the data and prints errors (in Polish).
- `config/*.json` are embedded into `dist/astromeow.html` as `window.DATA_EMBED`; in dev (index.html served by the server) `js/00-data.js` loads them with fetch. A file opened from `file://` without a build shows a message from Astruś.
- Planet unlock thresholds and multipliers: `js/06-base-data.js` (`PLANETS`).
- Skins and prices: `js/03-cat.js` (`SKINS`), golden life price: `GOLD_PRICE`.
- Colours: `css/01-base.css` (the `:root` block, a limited palette, see "Look and Astruś" below).

## Visit counter

A small Python server (standard library only) plus a SQLite database. It serves `dist/astromeow.html`, counts
**unique browsers** (a cookie with a random ID) and shows a live counter at `/live`. It runs behind a
`cloudflared tunnel`, so nothing has to be moved to Cloudflare Pages.

### The tunnel and the app are independent

| | What | How often |
|---|---|---|
| **Tunnel** | `cloudflared tunnel --url http://127.0.0.1:8085` | **once**, in a separate terminal/tmux, keep it open. The `…trycloudflare.com` address stays as long as this process lives |
| **App** | `bash run.sh` | **as often as you like**: builds the game, restarts the server on the same port, the database stays |

While the app restarts (1-2 s) the tunnel returns 502, then works again under the same address. You can make a QR code
once from the tunnel address: `https://…trycloudflare.com/?src=qr`.

> The port in `run.sh` (default **8085**) must match the one in the tunnel command (to change it: `PORT=9000 bash run.sh`).
> Do not close the tunnel terminal and do not suspend the machine. Restarting `cloudflared` = **a new address**, the QR
> stops working and the cookie counts everyone from scratch.

### Commands

From the `astromeow/` directory:

| Command | What it does |
|---|---|
| `bash run.sh` | build + (re)start in this terminal, Ctrl+C stops it |
| `bash run.sh -d` | the same in the background, logs in `counter/data/server.log` |
| `bash run.sh stop` / `status` / `logs` | stop / is it running + statistics / follow the logs |
| `bash counter/counter.sh stats` | statistics from the database (also when the server is down) |
| `bash counter/counter.sh reset` | backup + zeroing (**after testing, before going live**) |
| `bash counter/counter.sh export` | CSV to stdout (`> visits.csv`) |
| `bash counter/counter.sh backup` | manual database backup |
| `bash counter/counter.sh test` | 8 automatic checks, does not touch the real database |
| `bash counter/counter.sh install` | one-off: checks dependencies, builds the game, creates the database |

Variables: `PORT=8085`, `DB=path`, `PYTHON=python3`, `KEEP=10` (how many backups to keep), `BACKUP_DIR=~/astromeow-backup` (backups outside the repo; the same directory for `run.sh` and `counter.sh backup`/`reset`).

### What `run.sh` does on every start

1. **Build** (`build.py` → `dist/astromeow.html`). If the build fails, **the running instance is not touched**.
2. Stops the previous instance (pidfile `counter/data/server.pid`), so you can safely run it many times.
3. **Database backup** to `~/astromeow-backup/` outside the repo (`BACKUP_DIR`; the `KEEP` = 10 latest are kept, older ones are deleted).
4. Starts the server. If it crashes, the supervisor restarts it after 1 s (it gives up after 5 quick crashes in a row).
5. **Does not touch the data.** The database is a plain file and survives every restart.

### How it counts

1. On start the game (`js/22-counter.js`) does `POST /api/hit?src=…` (a counter error never breaks the game).
2. The server reads the `vid` cookie. Missing or invalid → it generates a UUID and sets the cookie for a year.
3. Written to the database: a new ID = a new row, a known ID = `hits + 1`. Bots and link previews (by User-Agent) are skipped.

**Unique = one browser**, not one person (a private window or a second phone count separately).
Describe the number as "unique devices/browsers".

### Database (SQLite)

There is no database server: it is the file `counter/data/counter.db` (next to `-wal` and `-shm`, which is normal, do not delete them
while the server is running). It is created on the first start and is in `.gitignore`.

```sql
CREATE TABLE visits (
  id         TEXT PRIMARY KEY,      -- vid cookie
  first_seen INTEGER NOT NULL,      -- unix time of the first visit
  last_seen  INTEGER NOT NULL,      -- unix time of the last one
  hits       INTEGER NOT NULL DEFAULT 1,
  src        TEXT NOT NULL DEFAULT ''   -- ?src= from the QR
);
```

Your own queries (needs `sqlite3`: `sudo apt install sqlite3`; without it `counter.sh stats` and `export` are enough):

```bash
sqlite3 counter/data/counter.db "SELECT COUNT(*) FROM visits;"
# visits per hour
sqlite3 counter/data/counter.db "SELECT strftime('%H:00', first_seen,'unixepoch','localtime') h, COUNT(*) FROM visits GROUP BY h;"
# who comes back (more than one launch)
sqlite3 counter/data/counter.db "SELECT COUNT(*) FROM visits WHERE hits > 1;"
# which QR works best
sqlite3 counter/data/counter.db "SELECT src, COUNT(*) FROM visits GROUP BY src ORDER BY 2 DESC;"
```

### What is public through the tunnel

Only what the server deliberately exposes: `/` (the game), `/api/hit`, `/api/stats` and `/live` (the counter is visible to
anyone who knows the address) and `/healthz`. The database, scripts and `.git` are not reachable.

### Smoke test

- [ ] `bash counter/counter.sh test` → "WSZYSTKO OK" (the script prints this in Polish)
- [ ] `bash counter/counter.sh reset` (zero after testing), then `bash run.sh -d`
- [ ] Open the QR link on your own phone: the number at `/live` goes up by 1
- [ ] Open it a second time on the same phone: the number does **not** go up (launches do)

### Limitations

- The server has to keep running for the counter to work. If the machine goes down, new players cannot load the game.
- A shared Wi-Fi network does no harm (we count by cookie, not by IP).
- You can enable Cloudflare Web Analytics in parallel as a second, independent (delayed) source.
- If you ever move to Cloudflare Pages the logic stays the same (Pages Functions + D1, the same schema).

## Look and Astruś (the main character)

The cat is called **Astruś** and it guides the player: greets them, comments on quiz answers, explains the tutorials and gives hints in the base (`catSay()` = Astruś + speech bubble). The app name stays "AstroMeow".

### Palette (light, limited; `css/01-base.css`, `:root`)

| Variable | Hex | Use |
|---|---|---|
| `--bg` | `#FFF8F0` | app background (warm cream) |
| `--surface` | `#FFFFFF` | cards, windows, answers |
| `--ink` | `#1B1446` | text and outlines (the navy of the suit) |
| `--orange` | `#F28A1E` | main colour, the one next action (`b-lav` button, active tab) |
| `--oranged` | `#A85200` | dark orange: small text and shadows on a light background |
| `--orange-soft` | `#FFEBD2` | orange tint: selection, tiles, planet background |
| `--muted` | `#645F7E` | secondary text |
| `--grey` | `#E8E1D6` | neutral grey: tracks, locked, disabled |
| `--ok` / `--ok-soft` | `#167A45` / `#DDF4E6` | **only** a right answer |
| `--bad` / `--bad-soft` | `#C62E2E` / `#FBDEDE` | **only** a wrong answer |

Rules: there is **one** orange button on the screen (the next step), the rest are white outlined buttons (`b-white`) or links (`.link`). Green and red appear nowhere except right/wrong feedback. Add new colours only in `:root`.

- Buttons and cards have a thick dark outline and a hard shadow. Confetti (`confetti()`) is small pieces in the palette colours.
- The cat: `cat/idle.webp` and `happy/sad/think/cheer.webp` (do not rename). `build.py` embeds them into `dist/astromeow.html`, so the file works on its own.
- `cat(pose, size)` draws Astruś, `catSay(pose, html)` gives "Astruś + speech bubble": use it to explain anything (quiz, mini-games, tutorial). `confirmSheet({...})` is a confirmation window with Astruś.
- The bottom menu (`#nav` in `index.html`) holds up to 6 tabs (add another `<button data-act="tab" data-arg="...">` and an entry in `setTab()` in `js/20-router.js`).

## Facts

The content of the Facts screen (categories: Ignis, Poles in space, POLSA, ESA, NASA) lives in `config/ciekawostki.json`. To add a fact, append an object (unique `id`, `title`, `text`, optional `astrus` and `source`) to `facts` of the chosen category; no code changes are needed. The category icon (`icon`) is the name of a file from `assets/facts/` without `.svg`, e.g. `"esa"` (our own stylised SVG, no official logos). The first category on the list is highlighted. The screen reads `DATA.ciekawostki` (loader from `js/00-data.js`) and stores read facts in `P.facts`.

### Profiles and leaderboard

Run the game with `python3 build.py` and `python3 counter/server.py serve`.
The server keeps nicknames, voice pitch, sessions and mini-game records in the existing SQLite file.
A copied standalone HTML works offline with a local profile. The leaderboard needs this server.
The blocked-name lists are in `config/blocked-words.pl.txt` and `config/blocked-words.en.txt`.
