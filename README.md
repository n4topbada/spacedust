# SPACE DUST

An English cosmic clicker. Collect dust, deploy 14 robotic tools, catch comets and grow through 12 stages from cosmic dust to an entire universe.

- 1800 × 750 desktop console with responsive mobile layout.
- Click a tool row to buy 1, 10 or the maximum affordable quantity.
- 28 exact ×2 tool upgrades, 12 synergies and three manual-click upgrades.
- Full-screen Craft workshop with 15 unique constellations and 60 individual star recipes.
- Four fixed conversion packages, five currencies, rare Spacedust and permanent upgrades.
- Actual crafting material consumption, set bonuses, lucky boxes and late-tool unlocks.
- Browser autosave, eight-hour offline collection, optional audio and reduced motion.

## Development

Use Node.js 24. Run npm ci, then npm run dev -- --hostname 127.0.0.1. The player-facing local address is http://localhost:3000/.

Run npm test for game rules and migration checks, npx tsc --noEmit for types, and npm run build for the application build.

## Main files

- app/page.tsx: simulation clock, persistence and universe/workshop navigation.
- components/tool-market.tsx: direct tool purchasing and research.
- components/crafting-screen.tsx: full-width workshop shell.
- components/constellation-workshop.tsx: selectable star diagrams and individual recipes.
- components/progression-panels.tsx: research, currency packages and permanent shop.
- lib/economy.ts: economic rules, transactions and save migration.
- lib/catalog.ts: celestial stages and tool definitions.
- lib/constellations.ts: 15 diagram geometries and variable star counts.
- components/celestial-scene.tsx: animated cosmic scene, limited to 45 fps.
- app/workshop.css: the new purchasing and crafting layout.

The game reuses generated sprite sheets in public/celestials.png, cosmos.png, equipment.png and comets.png. Diagram SVGs represent selectable crafting nodes. No new artwork was needed for this revision.

## Balance and saves

See [the current workshop revision](docs/workshop-update.md) for current rules, conversion amounts, assumptions and version-4 migration. [The previous balance notes](docs/constellation-balance.md) document the September 11 baseline; the workshop revision takes precedence where values changed.

Saves are local to each browser and origin. The key remains spacedust.save.v1. Old saves are backed up before migration, completed sets and earned bonuses are preserved, and the earlier one-time enhancement refund remains supported.

Growth is a fantasy progression rather than an astrophysical simulation.
