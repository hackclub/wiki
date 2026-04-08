---
title: Blot
description: Blot is Hack Club's drawing machine project — build a pen plotter that draws your code.
categories: ["Projects", "Hardware"]
tags: ["blot", "hardware", "art", "ysws"]
related: ["sprig", "hackathons"]
stub: false
banner: https://hackclub.com/stickers/hack-club-anime.png 
---

# Blot

Blot is Hack Club's pen plotter project. Like [[Sprig]], it's a "You Ship, We Ship" project: **write a drawing program, get a free Blot kit.**

## What is Blot?

Blot is a two-axis drawing machine (pen plotter) designed by Hack Club. You write code that moves the pen, and the machine draws it on paper.

## How It Works

1. Go to [blot.hackclub.com](https://blot.hackclub.com)
2. Write a JavaScript program using the Blot API
3. Preview your drawing in the browser
4. Submit to the [Blot gallery](https://github.com/hackclub/blot/tree/main/art)
5. HQ ships you a Blot kit to assemble and run your drawing

## The Blot API

Blot uses a simple JavaScript API for turtle-style drawing:

```js
const t = createTurtle();

// Draw a spiral
for (let i = 0; i < 100; i++) {
  t.forward(i * 0.5);
  t.right(91);
}

drawTurtles(t);
```

More complex drawings use parametric equations, fractals, L-systems, and more.

## The Hardware

The Blot kit is a CNC pen plotter with:

- Stepper motors on X and Y axes
- 3D-printed frame (all files open source)
- Arduino-compatible controller
- Servo for pen up/down

Assembly takes about 2–3 hours. Full instructions are in the repo.

## The Gallery

Browse hundreds of community-made Blot drawings at [blot.hackclub.com](https://blot.hackclub.com). From geometric patterns to portraits to algorithmic art.

## Tips

- Start simple — a basic geometric pattern is a great first submission
- Iterate in the browser preview before building
- Look at existing gallery submissions for inspiration
- Comment your code so others can learn from it
