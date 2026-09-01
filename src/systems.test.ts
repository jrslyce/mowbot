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
  it("adds pickup Arms with distinct carrying capacities", () => {
    expect(parts.arms).toHaveLength(3); expect(starterLoadout.arms).toBe("arms_basic_claw");
    const basic = calculateStats(starterLoadout); const upgraded = calculateStats({ ...starterLoadout, arms: "arms_magnet_boom" });
    expect(basic.basketCapacity).toBe(1); expect(upgraded.basketCapacity).toBe(3); expect(upgraded.pickupRadius).toBeGreaterThan(basic.pickupRadius);
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
  it("bounces away from a house instead of stopping", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.mower.position = { x: -1.7, z: -1.8 }; game.mower.angle = Math.PI / 2; game.mower.speed = game.stats.maxSpeed;
    game.tick({ steer: 0, throttle: 1, brake: 0, reverse: 0, interact: false, pause: false }, 0.05);
    expect(game.mower.position.x).toBeLessThan(-1.7); expect(Math.sin(game.mower.angle)).toBeLessThan(0); expect(game.mower.speed).toBeGreaterThan(0); expect(game.state.message).toContain("House bounce");
  });
  it("bounces away from a tree and keeps the tree interaction", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.mower.position = { x: -9.12, z: 6.5 }; game.mower.angle = Math.PI / 2; game.mower.speed = game.stats.maxSpeed;
    game.tick({ steer: 0, throttle: 1, brake: 0, reverse: 0, interact: false, pause: false }, 0.05);
    expect(game.mower.position.x).toBeLessThan(-9.12); expect(Math.sin(game.mower.angle)).toBeLessThan(0); expect(game.mower.speed).toBeGreaterThan(0); expect(game.drops.length).toBeGreaterThan(0);
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
  it("slows unfinished tall grass and requires repeated passes before cutting", () => {
    const game = new GameEngine("ranch-house", starterLoadout); const patch = game.level.tallGrassPatches[0];
    game.mower.position = { ...patch.center }; game.mower.speed = game.stats.maxSpeed; game.tick(undefined, 0.01);
    expect(game.mower.speed).toBeLessThan(game.stats.maxSpeed); expect(game.tallGrassPasses.get(patch.id)).toBe(1); const firstCut = game.state.cutCells;
    for (let pass = 1; pass < patch.passesRequired; pass += 1) { game.mower.position = { x: patch.center.x + patch.width, z: patch.center.z }; game.mower.speed = 0; game.tick(undefined, 0.01); game.mower.position = { ...patch.center }; game.mower.speed = 0; game.tick(undefined, 0.01); }
    expect(game.tallGrassPasses.get(patch.id)).toBe(patch.passesRequired); expect(game.state.cutCells).toBeGreaterThan(firstCut);
  });
  it("loads a tree drop with Arms and delivers it to the dock basket", () => {
    const game = new GameEngine("ranch-house", starterLoadout); game.debug.bumpTreeDrop(); const drop = game.drops[0]; expect(drop).toBeDefined();
    game.mower.position = { ...drop.position }; game.mower.speed = 0; game.tick(undefined, 0.01); expect(drop.carried).toBe(true); expect(game.state.carriedItems).toContain(drop.id);
    game.debug.teleportToDock(); game.tick(undefined, 0.01); expect(drop.delivered).toBe(true); expect(game.state.carriedItems).toHaveLength(0); expect(game.state.deliveredItems).toBe(1);
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
