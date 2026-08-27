import { describe, expect, it } from "vitest";
import { levels, validateLevel } from "./data/levels";
import { calculateStats, parts, starterLoadout } from "./data/upgrades";
import { GameEngine } from "./engine";
import { calculateResults, defaultSave, equip, GrassCellState, GrassGrid, loadSave } from "./systems";

describe("grass grid", () => {
  it("keeps exclusions out of the completion denominator", () => {
    const grid = new GrassGrid(4, 4, 1, [{ kind: "rect", center: { x: 0, z: 0 }, width: 2, depth: 2 }]);
    expect(grid.total).toBe(12); expect([...grid.states].filter((state) => state === GrassCellState.NonMowable)).toHaveLength(4);
  });
  it("cuts each grass cell only once", () => {
    const grid = new GrassGrid(4, 4, 1, []); const first = grid.cutFootprint({ x: 0, z: 0 }, 1.1); const repeat = grid.cutFootprint({ x: 0, z: 0 }, 1.1);
    expect(first).toBeGreaterThan(0); expect(repeat).toBe(0); expect(grid.completion).toBeGreaterThan(0);
  });
});

describe("data and upgrades", () => {
  it("validates all five level definitions", () => { expect(levels).toHaveLength(5); for (const level of levels) expect(validateLevel(level)).toEqual([]); });
  it("uses the requested triple-speed starter turn rate", () => { expect(calculateStats(starterLoadout).turnSpeed).toBeCloseTo(7.8); });
  it("supports collected dock cosmetics and new mower shapes", () => {
    const save = defaultSave(); const collected = { ...save, garage: { ...save.garage, unlockedPartIds: [...save.garage.unlockedPartIds, "dock_round_plaza", "body_wedge_aero"] } };
    expect(parts.dock).toHaveLength(4); expect(equip(collected, "dock", "dock_round_plaza").garage.equipped.dock).toBe("dock_round_plaza"); expect(equip(collected, "dock", "body_wedge_aero")).toEqual(collected);
  });
  it("makes a wide deck and long range battery materially different", () => {
    const standard = calculateStats(starterLoadout); const upgraded = calculateStats({ ...starterLoadout, deck: "deck_wide", battery: "battery_long_range" });
    expect(upgraded.deckRadius).toBeGreaterThan(standard.deckRadius); expect(upgraded.capacity).toBeGreaterThan(standard.capacity);
  });
  it("recovers from malformed saves", () => {
    const storage = { getItem: () => "not-json" }; expect(loadSave(storage)).toEqual(defaultSave());
  });
});

describe("runs", () => {
  it("completes at 98 percent and awards a perfect result at 100", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.debug.complete(); expect(game.state.status).toBe("complete"); expect(game.results?.perfect).toBe(true); expect(game.results?.rank).toBe("S");
  });
  it("grants one strike during collision invulnerability", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.debug.teleportToHazard(); game.tick({ steer: 0, throttle: 0, brake: 0, reverse: 0, interact: false, pause: false }, 0.02); game.tick({ steer: 0, throttle: 0, brake: 0, reverse: 0, interact: false, pause: false }, 0.02);
    expect(game.state.strikesRemaining).toBe(2); expect(game.state.hazardsHit).toHaveLength(1);
  });
  it("turns left for negative steering input", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.mower.speed = 2; game.tick({ steer: -1, throttle: 0, brake: 0, reverse: 0, interact: false, pause: false }, 0.1);
    expect(game.mower.angle).toBeGreaterThan(0);
  });
  it("bounces off the Cul-de-Sac grass edge and keeps moving inward", () => {
    const game = new GameEngine("cul-de-sac", starterLoadout); const limitX = game.level.world.width / 2 - game.level.world.boundaryPadding;
    game.mower.position = { x: limitX - 0.05, z: 0 }; game.mower.angle = Math.PI / 2; game.mower.speed = game.stats.maxSpeed;
    game.tick({ steer: 0, throttle: 1, brake: 0, reverse: 0, interact: false, pause: false }, 0.05);
    expect(game.mower.position.x).toBe(limitX); expect(game.mower.speed).toBeGreaterThan(0); expect(game.state.message).toContain("Edge bounce");
    const edgeX = game.mower.position.x; game.tick({ steer: 0, throttle: 1, brake: 0, reverse: 0, interact: false, pause: false }, 0.05); expect(game.mower.position.x).toBeLessThan(edgeX);
  });
  it("can drive off the Cul-de-Sac dock even though it sits on a driveway", () => {
    const game = new GameEngine("cul-de-sac", starterLoadout); const before = { ...game.mower.position };
    game.tick({ steer: 0, throttle: 1, brake: 0, reverse: 0, interact: false, pause: false }, 0.1);
    expect(game.mower.position.z).toBeGreaterThan(before.z); expect(game.mower.speed).toBeGreaterThan(0);
  });
  it("stops mowing voluntarily only while parked at the dock", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.mower.position = { x: 0, z: 0 }; game.stopMowingAtDock(); expect(game.state.status).toBe("playing");
    game.debug.teleportToDock(); game.stopMowingAtDock(); expect(game.state.status).toBe("stopped"); expect(game.results).not.toBeNull();
  });
  it("can shake a bonus item loose from a bumped tree", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.debug.bumpTreeDrop(); game.debug.bumpTreeDrop(); game.debug.bumpTreeDrop();
    expect(game.drops.length).toBeGreaterThan(0); expect(["fruit", "frisbee", "ball", "animal"]).toContain(game.drops[0].kind);
  });
  it("plans and follows a safe return route to base", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.mower.position = { x: -7, z: 7 }; game.returnToDock(); for (let index = 0; index < 800; index += 1) game.tick(undefined, 0.03);
    expect(Math.hypot(game.mower.position.x - game.level.start.dock.x, game.mower.position.z - game.level.start.dock.z)).toBeLessThan(1.35);
    expect(game.state.message).toContain("Base reached");
  });
  it("returns control to the player when manual input interrupts docking", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.mower.position = { x: -7, z: 7 }; game.returnToDock(); game.tick({ steer: 0, throttle: 1, brake: 0, reverse: 0, interact: false, pause: false }, 0.1);
    expect(game.state.message).toBe("Return cancelled"); expect(game.mower.position.z).toBeGreaterThan(7);
  });
  it("enters reserve away from dock and leaves it when charging", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.mower.position = { x: 0, z: 8 }; game.debug.setBatteryPercent(0); game.tick(undefined, 0.1); expect(game.state.reserveMode.active).toBe(true); game.debug.teleportToDock(); game.tick(undefined, 0.1); expect(game.state.reserveMode.active).toBe(false);
  });
  it("uses the deterministic end-score formula", () => {
    const result = calculateResults({ cutCells: 100, completion: 100, elapsed: 10, target: 30, strikes: 3, collectibles: 2, batteryPercent: 50, multiplier: 1, charges: 0 });
    expect(result.score).toBe(12_000); expect(result.rank).toBe("S");
  });
});
