# Chitravela 🎨

A skribbl.io-style multiplayer drawing & guessing game, built to run entirely
on GitHub Pages + Firebase (no server to run, crash, or sleep).

## How it works (short version)

- The site is plain HTML/CSS/JS — GitHub Pages just serves the files.
- Firebase Realtime Database handles all the live sync (turns, drawing
  strokes, chat, scores) directly from each player's browser.
- One player's browser (the room "host") drives the turn/timer logic —
  there's no game server. This keeps things free and simple, and is why
  test-mode is fine for a small friend group.

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Chitravela v1"
git branch -M main
git remote add origin https://github.com/<your-username>/chitravela.git
git push -u origin main
```

## 2. Turn on GitHub Pages (Deploy from branch)

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder `/ (root)` → Save
4. Wait ~1 minute, your site will be live at:
   `https://<your-username>.github.io/chitravela/`

## 3. Lock down Firebase rules (do this before sharing widely)

You're currently in **test mode**, which lets anyone on the internet
read/write your whole database — fine while building, but tighten it up
once things work. Firebase console → Realtime Database → Rules → paste:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    },
    "publicRooms": {
      ".read": true,
      ".write": true
    }
  }
}
```

This still allows open read/write (needed since there's no server to
authenticate requests), but scopes it to just the `rooms` and
`publicRooms` paths instead of your whole project. Good enough for a
friends game. (A fully locked-down version would need Firebase Cloud
Functions to hide the current word from guessers — out of scope here,
and the free Spark plan doesn't include the outbound-network access
Cloud Functions need for this anyway.)

## 4. Add / edit words

Open `js/words.js`. Just add strings to the `easy`, `medium`, or `hard`
arrays — no rebuild step needed, just commit + push and GitHub Pages
updates automatically within a minute or two.

To add a whole new **word pack** (e.g. "Movies", "Anime"):

```js
export const WORD_PACKS = {
  classic: { label: "Classic", easy: [...], medium: [...], hard: [...] },
  movies: {
    label: "Movies",
    easy: ["titanic", "up", "cars"],
    medium: ["inception", "gladiator"],
    hard: ["interstellar", "whiplash"]
  }
};
```

Then add `<option value="movies">Movies</option>` inside the
`#packSelect` dropdown in `index.html`.

## 5. Known limitations (worth knowing)

- **No server = no hidden word.** The current word is technically
  visible in the Firebase data to anyone who opens dev tools. Fine for
  casual play with friends; just know it's not cheat-proof.
- **Host-driven timing.** If the room host's tab closes mid-round, the
  round can stall until someone else's client picks it back up on the
  next interaction. For a friend group this is rarely noticeable.
- **Reconnects rejoin your last room automatically** (stored in your
  browser), which is the main "Disconnected!" annoyance from skribbl.io
  this build was meant to fix.

## Local testing

Because this uses ES modules, opening `index.html` directly (`file://`)
won't work in most browsers. Run a tiny local server instead:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then visit `http://localhost:8000` (or whatever port it prints).

Have fun! 🖌️
