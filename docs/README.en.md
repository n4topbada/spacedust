# SPACE DUST

**A cosmic clicker built in a few hours, inspired and designed by my son.**

[Play the game](https://spacedust-nine.vercel.app/) · [한국어](../README.md)

## The story

My elementary-school-aged son asked me to make a game about collecting space dust. Tiny grains gather into clumps, then asteroids and planets, eventually growing into a black hole, galaxies, and an entire universe.

He also shaped the design. I turned his ideas and handwritten plans into a playable web game: robotic collectors, passing comets, upgrades, special currencies, and constellation crafting. The game became playable in a few hours, and his follow-up requests shaped the finished version.

**Status:** Feature development is complete. The project closes with a code and documentation cleanup on September 17, 2026.

![Space Dust gameplay](screenshots/universe.png)

## Features

- Twelve celestial stages, from dust to an entire universe, with Canvas animation.
- Manual collection and fourteen robotic tools; buy one, ten, or the maximum affordable quantity.
- Twenty-eight exact ×2 tool upgrades, twelve synergies, and three manual-click research tiers.
- Regular and golden comet bonuses, visual effects, and optional sound.
- A dedicated Craft screen with fifteen distinct constellations and sixty individual star recipes.
- Four fixed conversion packages, five special currencies, permanent upgrades, and lucky boxes.
- Browser autosave, up to eight hours of offline production, and reduced-motion settings.
- A wide 1800 × 750 desktop console with a responsive mobile layout.

Celestial evolution is a fantasy progression created for the game.

## Run and verify

Use Node.js 24.21.0 or a newer 24.x patch. `.nvmrc` pins the verified version.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open [http://localhost:3000](http://localhost:3000).

```sh
npm run check         # Lint, types, 23 game tests, and formatting
npm run build:vercel  # Static Vercel build → dist/client
npm run build         # Existing Cloudflare / Sites build
```

Use `npm run format` to format source and documentation. GitHub Actions runs the same checks and static build for each pull request.

## Code map

| Path                                                           | Responsibility                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `app/page.tsx`                                                 | Simulation clock, persistence, input, and screen navigation             |
| `components/game-dialogs.tsx`                                  | Help, settings, growth journey, and completion dialogs                  |
| `components/starfield.tsx`, `celestial-scene.tsx`              | Background stars and celestial animation                                |
| `components/tool-market.tsx`                                   | Direct tool purchasing and research tabs                                |
| `components/crafting-screen.tsx`, `constellation-workshop.tsx` | Workshop navigation and star crafting                                   |
| `components/progression-panels.tsx`                            | Research, conversions, and permanent upgrades                           |
| `lib/economy.ts`                                               | Transactions, rewards, crafting, and save migrations                    |
| `lib/catalog.ts`, `constellations.ts`                          | Tool/stage data and constellation geometry                              |
| `tests/game.test.mjs`                                          | Economic rules and save compatibility                                   |
| `public/`                                                      | Illustration sprite sheets generated during development and the favicon |

Built with React 19, TypeScript, Vinext/Vite, Tailwind CSS, and Base UI. The live game runs as a static browser application and requires no player accounts or database.

## Deployment and saves

Live URL: **[spacedust-nine.vercel.app](https://spacedust-nine.vercel.app/)**. The Vercel project is `spacedust`. After linking the project, deploy with `vercel deploy --prod`; `vercel.json` contains the build settings.

Progress is stored in `localStorage` for each browser and origin. Redeploying to the same domain preserves the save, but progress does not automatically sync across devices or domains. The key remains `spacedust.save.v1`; the current schema is version 4, with migrations for older saves.

See [the workshop revision](workshop-update.md) for current balance and design decisions, and [the closeout notes](project-closeout.md) for the final scope and handover.
