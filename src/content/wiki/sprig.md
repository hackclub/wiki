---
title: Sprig
description: Sprig is Hack Club's handheld game console — write a game in the browser, get a free device shipped to you.
categories: ["Projects", "Hardware"]
tags: ["sprig", "games", "hardware", "ysws"]
related: ["hackathons", "blot"]
---

# Sprig

Sprig is Hack Club's handheld game console project. The concept: **write a game in the Sprig editor, get a free device shipped to you.**

## How It Works

1. Go to [sprig.hackclub.com](https://sprig.hackclub.com)
2. Build a game using the JavaScript-based Sprig API
3. Submit your game as a pull request to the [Sprig GitHub repo](https://github.com/hackclub/sprig)
4. Once merged, HQ ships you a Sprig console — **free**

## The Sprig Console

The Sprig is a custom PCB designed by Hack Club. It features:

- **Raspberry Pi RP2040** microcontroller
- **160×128 TFT display**
- **8 buttons** (WASD + IJKL layout)
- **Speaker** for audio
- **Open source** — you can modify everything

## The Game Engine

Sprig games are written in JavaScript using a simple grid-based API:

```js
const player = "p";

setLegend([
  player,
  bitmap`
0000000000000000
0000000000000000
0000000HHH000000
...`,
]);

setSolids([player]);

let level = 0;
const levels = [
  map`
p.
..`,
];

setMap(levels[level]);

onInput("w", () => {
  getFirst(player).y -= 1;
});
```

## Sprig Gallery

The Sprig gallery at [sprig.hackclub.com/gallery](https://sprig.hackclub.com/gallery) has hundreds of games made by Hack Clubbers. Browse for inspiration or fork existing games to remix.

## Tips for Getting Your PR Merged

- Make sure your game is **playable** — it should have a win/loss state
- Add a `README` explaining how to play
- Test on mobile (the editor works in browsers)
- Keep the code readable for others to learn from

## Hardware Deep Dive

If you want to understand the hardware, check out the [Sprig GitHub repo](https://github.com/hackclub/sprig). All PCB files, firmware, and schematics are open source.

You can also order spare parts and assemble your own Sprig from scratch using the BOM (bill of materials) in the repo.
