# Jad Menkara — portfolio v2 (nov 2026)

The whole site lives on a 3D cube (pure CSS transforms, no WebGL). The front face is a working console with an ASCII portrait.
Rotate with the side nav, ← →, keys 1–6, swipes on mobile, `cd <face>` in the console, or links like `/#builds`.

```
npm install
npm run dev      # local dev
npm run build    # static output in dist/ — deploy anywhere (Vercel, Netlify, GH Pages)
```

## Editing content
All site text and data lives in `src/data/` (the dev server reloads on save):

| file | what's in it |
| --- | --- |
| `home.json` | left-side intro (eyebrow, name, tagline), bio beside the face, console greeting, quick-command buttons, startup lines |
| `sections.json` | menu label, heading and subtitle for each cube face; contact big line + footer |
| `projects.json` | builds (`short`, `sub`, `tag`, `slug` + full details for the pop-up) |
| `experiences.json` | field log: `work` and `volunteer` |
| `awards.json` | honors list |
| `stats.json` | the four number tiles on the honors face |
| `skills.json` | toolchain columns |
| `contact.json` | email / linkedin / github / resume (`""` hides one) |
| `face.json`, `cats.json` | generated (ASCII portrait, cat photo paths) — no need to edit |

In `home.json` and `sections.json` text, `*word*` makes a red highlight and `_word_` makes it grey.
Images go in `public/img/` and are referenced as `/img/name.webp`.

## Console commands
help · whoami · builds · open <n|slug> · work · community · honors · stack · contact · resume · cd <face> · spin · cat · hire · ls · clear
