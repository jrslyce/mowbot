# MOWBOT

MOWBOT is a browser-based Three.js vertical slice about piloting an upgradeable robot lawnmower through isometric yards. The player cuts grass, manages battery, avoids hidden hazards and animals, collects upgrade parts, and returns to the charging dock before reserve power runs out.

The project is built as a Vite + TypeScript app with a deliberately small engine layer so gameplay behavior can be tested without rendering.

## Current Slice

- Five playable level definitions: Ranch House, Cul-de-Sac, Orchard Yard, Lakeside Cabin, and Estate Challenge.
- Three.js isometric renderer with orthographic camera follow, low-poly props, visible cut/uncut grass, hazards, collectibles, animals, dock, and mower customization visuals.
- Rapier static collider setup plus a custom gameplay engine for mower movement, grass cutting, battery, charging, reserve mode, strikes, collectibles, scoring, results, and save data.
- Keyboard controls, gamepad polling, and landscape mobile touch controls.
- Garage screen with unlockable parts, equipment changes, and stat updates.
- Vitest unit/integration coverage and Playwright browser smoke tests.

## Quick Start

```sh
npm install
npm run dev
```

Vite serves the game at the local URL printed by the command.

## Verification

```sh
npm run build
npm run test
npm run test:browser
```

Or run the full local gate:

```sh
npm run check
```

Playwright screenshots and traces are written under `output/` during browser tests. Production build output is written under `dist/`.

## Project Map

- `src/main.ts` owns screens and UI flow: level select, garage, gameplay HUD, pause, results, save persistence, and debug helpers.
- `src/engine.ts` owns gameplay state and simulation: movement, mowing, hazards, animals, battery, docking, scoring transitions, and test/debug hooks.
- `src/renderer.ts` owns Three.js scene construction and render synchronization from `GameEngine`.
- `src/input.ts` normalizes keyboard, gamepad, and touch input.
- `src/physics.ts` initializes Rapier and static level colliders.
- `src/systems.ts` contains testable pure-ish systems: grass grid, result scoring, save defaults/load/persist, unlocks, and equip logic.
- `src/data/levels.ts` defines all playable lawns and validates level shape.
- `src/data/upgrades.ts` defines mower parts, colors, starter loadout, and stat calculation.
- `src/types.ts` is the shared contract layer across systems, rendering, data, and UI.
- `tests/mowbot.spec.ts` contains Playwright smoke coverage for desktop and mobile controls.
- `MOWBOT-threejs-isometric-robot-lawnmower-spec.md` is the original implementation brief and product reference.

## Gameplay Controls

- `W` or `ArrowUp`: drive forward.
- `S` or `ArrowDown`: reverse.
- `A` or `ArrowLeft`: turn left.
- `D` or `ArrowRight`: turn right.
- `Space`: brake.
- `Escape`: pause.
- On touch viewports, use the on-screen drive pad and Return button.

## Debug Hooks

The app exposes `window.__MOWBOT_DEBUG__` while a level is running. Browser tests use it to inspect mower position, complete a level, set battery, teleport to dock or hazards, unlock all parts, and reset save data.

When adding new debug helpers, keep them test-oriented and do not make them visible in production UI unless gated by the existing `?debug=1` path.

## Notes For Future Agents

Start with `AGENTS.md` for contributor guidance and `MOWBOT-threejs-isometric-robot-lawnmower-spec.md` for the fuller design target. The highest-value extension work is usually in the boundary between `src/engine.ts` and `src/renderer.ts`: add behavior to the engine first, prove it with Vitest, then mirror the resulting state visually in the renderer.

Keep `node_modules/`, `dist/`, zipped uploads, and Playwright output out of git. They are generated from the committed source and can become very noisy.
