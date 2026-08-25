# Agent Guide

This repo contains MOWBOT, a Vite/TypeScript browser game vertical slice. Treat `README.md` as the operator guide and `MOWBOT-threejs-isometric-robot-lawnmower-spec.md` as the full product brief.

## How To Work Here

1. Read `package.json` and this file before changing code.
2. Prefer data-driven additions in `src/data/levels.ts` and `src/data/upgrades.ts`.
3. Keep gameplay rules in `src/engine.ts` or `src/systems.ts` before adding visual representation in `src/renderer.ts`.
4. Add or update Vitest coverage for engine/system behavior.
5. Use Playwright when a change affects screens, controls, canvas rendering, or responsive layout.
6. Run `npm run check` before final handoff when the change touches runtime behavior.

## Architecture Boundaries

- `src/main.ts`: DOM screens, event wiring, HUD updates, save persistence, and debug helper exposure.
- `src/engine.ts`: deterministic run state and gameplay simulation. This should stay mostly renderer-agnostic.
- `src/renderer.ts`: Three.js scene creation and syncing visuals from engine state.
- `src/input.ts`: normalized input from keyboard, gamepad, and touch controls.
- `src/systems.ts`: standalone systems that are easiest to unit test.
- `src/data/*`: authored content and stat tables.
- `src/types.ts`: shared data contracts.

## Testing Expectations

- `npm run build` checks TypeScript and creates the production bundle.
- `npm run test` runs Vitest unit/integration tests.
- `npm run test:browser` runs Playwright smoke tests.
- `npm run check` runs all of the above.

If a browser test fails, inspect `output/playwright/` for screenshots and traces.

## Version-Control Hygiene

Generated folders and upload artifacts should stay untracked:

- `node_modules/`
- `dist/`
- `output/`
- `*.zip`

Commit source, tests, configs, lockfiles, and docs. Do not commit generated Playwright screenshots unless someone explicitly asks for test artifacts.

## Safe Extension Pattern

For a new gameplay feature:

1. Add or adjust types in `src/types.ts`.
2. Implement state changes in `src/systems.ts` or `src/engine.ts`.
3. Cover the behavior with Vitest.
4. Update Three.js visuals in `src/renderer.ts`.
5. Wire UI in `src/main.ts` only after the state is stable.
6. Add Playwright coverage if the player can see or control the feature.

This order keeps the game testable and avoids hiding rules inside rendering code.
