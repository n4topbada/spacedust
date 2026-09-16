# SPACE DUST

**Start with a grain of dust. Click your way to an entire universe.**

[Play now](https://spacedust-nine.vercel.app/) · [한국어](../README.md)

![Space Dust gameplay](screenshots/universe.png)

## Imagined by my son

My elementary-school-aged son asked me to make a game about collecting space dust, so I built this web game in a few hours. He shaped the design, too. His ideas and handwritten plans became a world where dust gathers into planets, grows into black holes, and eventually becomes an entire universe—with robotic collectors, passing comets, and constellations to craft along the way.

At first, you collect tiny grains by hand. Then you buy tools, research stronger collection methods, and spend your resources completing constellations. **There is always another celestial form to discover or a stronger tool to unlock.**

## How to play

1. **Click the celestial body to collect dust.** You begin with a cloud of drifting particles. Manual clicks and automatic collection fuel your growth, changing the body's appearance and effects as you progress.
2. **Buy tools to automate collection.** Click a tool in the right-hand shop to purchase it. Fourteen tools take you from `Stardust Tweezers` through `Comet Tail Inceptor` to `Cosmic Rebirth`. Buy one, ten, or the maximum you can afford.
3. **Research better collection.** Choose from twenty-eight upgrades that double individual tool output, twelve synergies between tools, and three manual-click research tiers. Decide where your next investment will make the biggest difference.
4. **Catch passing comets.** Click a comet as it crosses the screen to collect bonus dust. Golden comets bring an even larger reward.
5. **Complete constellations in Craft.** Convert dust into special currencies, then spend tools and resources to craft stars. Each star and completed constellation grants permanent bonuses, and later milestones unlock the most powerful tools.

## From dust to the universe

Explore twelve stages of growth. A black hole is another step on the journey, with galaxies and an even larger cosmos still ahead.

> Cosmic Dust → Dust Cluster → Asteroid → Protoplanet → Planet → Star → Red Giant → Black Hole → Galaxy → Galaxy Group → Galaxy Cluster → The Universe

Drifting particles, orbital trails, and glowing effects change as you grow. Watch the tiny speck you started clicking become a universe that fills the screen.

## Constellations and special currencies

Craft contains **fifteen distinct constellations and sixty individual stars**. Select a star to see its recipe. Crafting consumes dust, tools, and special currencies, with later constellations requiring stronger equipment and more materials.

There are five special currencies: `Stardust`, `Moondust`, `Galaxydust`, `Solardust`, and `Spacedust`. Each conversion package randomly selects one common currency and awards the entire amount in that currency. Rare Spacedust can also serve as a wildcard crafting material.

You can spend currencies on permanent improvements to comet frequency, manual collection, and comet rewards. Completed constellations provide extra bonuses and lucky boxes. Completing five, ten, and fifteen constellations unlocks the final three tools, one at each milestone.

## Jump in

**[Play in your browser](https://spacedust-nine.vercel.app/)** with no installation or sign-up. The game interface is in English, with a wide 1800 × 750 desktop layout and mobile support. Autosave, up to eight hours of offline collection, optional sound, and reduced-motion settings are included.

## Make it your own

This project is available under the **[MIT License](../LICENSE)**. Feel free to download, play, modify, improve, reuse, or redistribute it, including for commercial purposes. Keep the original copyright notice and license text with copies or distributions.

Add new celestial stages or tools, experiment with the balance, or turn it into your own clicker game. I hope this little project becomes a starting point for someone else's ideas.

## Run and modify locally

Use Node.js 24.21.0 or a newer 24.x patch. Built with React 19, TypeScript, Vinext/Vite, Tailwind CSS, and Base UI.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open [http://localhost:3000](http://localhost:3000).

```sh
npm run check         # Lint, types, game tests, and formatting
npm run build:vercel  # Static website build → dist/client
```

Edit screens in `app/` and `components/`, tools and celestial stages in `lib/catalog.ts`, game rules in `lib/economy.ts`, and constellations in `lib/constellations.ts`. See the [workshop notes](workshop-update.md) for detailed crafting rules.
