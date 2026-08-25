import { getLevel } from "./data/levels";
import { calculateStats } from "./data/upgrades";
import { calculateResults, distance, GrassGrid } from "./systems";
import type { AnimalDefinition, EquippedLoadout, LevelDefinition, NormalizedInput, Results, RunState, Vec2 } from "./types";

type AnimalRuntime = AnimalDefinition & { position: Vec2; phase: number; state: "idle" | "wander" | "alert" | "flee" | "return"; bumped: boolean };
const emptyInput: NormalizedInput = { steer: 0, throttle: 0, brake: 0, reverse: 0, interact: false, pause: false };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export class GameEngine {
  level: LevelDefinition; grass: GrassGrid; state: RunState; mower: { position: Vec2; angle: number; speed: number; invulnerable: number };
  hazards: Map<string, { revealed: boolean; hit: boolean }> = new Map(); collectibles = new Set<string>(); animals: AnimalRuntime[]; results: Results | null = null; private docked = true; private streak = 0; private returningToDock = false; private returnPath: Vec2[] = [];
  constructor(levelId: string, readonly loadout: EquippedLoadout) {
    this.level = getLevel(levelId); this.grass = new GrassGrid(this.level.world.width, this.level.world.depth, this.level.world.cellSize, this.level.excluded);
    const stats = calculateStats(loadout);
    this.state = { levelId: this.level.id, status: "playing", elapsedSeconds: 0, completionPercent: 0, cutCells: 0, totalMowableCells: this.grass.total, score: 0, multiplier: 1, strikesRemaining: 3, batteryEnergy: stats.capacity, batteryCapacity: stats.capacity, chargesUsed: 0, reserveMode: { active: false, secondsRemaining: 15 }, collectedThisRun: [], hazardsHit: [], message: "Docked and ready" };
    this.mower = { position: { ...this.level.start.position }, angle: this.level.start.rotation, speed: 0, invulnerable: 0 };
    this.level.hazards.forEach((hazard) => this.hazards.set(hazard.id, { revealed: !hazard.hidden, hit: false }));
    this.animals = this.level.animals.map((animal, index) => ({ ...animal, position: { ...animal.home }, phase: index * 1.7, state: "idle", bumped: false }));
  }
  get stats() { return calculateStats(this.loadout); }
  setPaused(paused: boolean): void { if (this.state.status === "playing" || this.state.status === "paused") this.state.status = paused ? "paused" : "playing"; }
  tick(input: NormalizedInput = emptyInput, rawDelta: number): void {
    const dt = Math.min(rawDelta, 0.05); if (this.state.status !== "playing") return; this.state.elapsedSeconds += dt; this.mower.invulnerable = Math.max(0, this.mower.invulnerable - dt);
    const stats = this.stats; const reserve = this.state.reserveMode.active; const maxSpeed = stats.maxSpeed * (reserve ? 0.35 : 1);
    if (this.returningToDock && (Math.abs(input.steer) > 0.08 || input.throttle > 0.08 || input.reverse > 0.08 || input.brake > 0.08)) this.cancelReturnToDock();
    if (this.returningToDock) this.followReturnPath(dt, maxSpeed);
    else { const requested = input.throttle * maxSpeed - input.reverse * 2; const accel = (input.brake > 0 ? 18 : stats.acceleration) * dt; this.mower.speed += clamp(requested - this.mower.speed, -accel, accel); if (input.brake > 0 && Math.abs(this.mower.speed) < 0.15) this.mower.speed = 0; const turn = input.steer * stats.turnSpeed * clamp(Math.abs(this.mower.speed) / Math.max(0.2, maxSpeed), 0.3, 1) * dt; this.mower.angle -= turn; const next = { x: this.mower.position.x + Math.sin(this.mower.angle) * this.mower.speed * dt, z: this.mower.position.z + Math.cos(this.mower.angle) * this.mower.speed * dt }; if (this.blocked(next)) this.mower.speed = 0; else this.mower.position = next; }
    this.updateAnimals(dt); this.updateRevealAndContacts();
    const newlyCut = reserve ? 0 : this.grass.cutFootprint(this.mower.position, stats.deckRadius); this.state.cutCells = this.grass.cut; this.state.completionPercent = this.grass.completion;
    if (newlyCut > 0) { this.streak += newlyCut; this.state.score += newlyCut * 10; if (this.streak >= 100) { this.state.multiplier = Math.min(3, Math.round((this.state.multiplier + 0.05) * 100) / 100); this.streak = 0; } }
    this.updateBattery(dt, newlyCut > 0); if (this.state.status !== "playing") return;
    if (this.state.completionPercent >= this.level.scoring.requiredCompletionPercent) this.complete();
  }
  private blocked(point: Vec2): boolean {
    const bounds = this.level.world; if (Math.abs(point.x) > bounds.width / 2 - bounds.boundaryPadding || Math.abs(point.z) > bounds.depth / 2 - bounds.boundaryPadding) return true;
    return this.level.objects.filter((object) => object.type !== "dock").some((object) => object.collider.kind === "circle" ? distance(point, object.position) < object.collider.radius + 0.45 : Math.abs(point.x - object.position.x) < object.collider.width / 2 + 0.45 && Math.abs(point.z - object.position.z) < object.collider.depth / 2 + 0.45);
  }
  returnToDock(): void {
    if (this.returningToDock) { this.cancelReturnToDock(); return; }
    if (distance(this.mower.position, this.level.start.dock) < 1.3) { this.state.message = "Already at base"; return; }
    this.returnPath = this.planReturnPath(); this.returningToDock = true; this.state.message = "Returning to base";
  }
  cancelReturnToDock(): void { this.returningToDock = false; this.returnPath = []; this.state.message = "Return cancelled"; }
  private planReturnPath(): Vec2[] {
    const step = 1; const minX = -this.level.world.width / 2 + 1; const maxX = this.level.world.width / 2 - 1; const minZ = -this.level.world.depth / 2 + 1; const maxZ = this.level.world.depth / 2 - 1;
    const columns = Math.floor((maxX - minX) / step) + 1; const rows = Math.floor((maxZ - minZ) / step) + 1; const toIndex = (x: number, z: number) => z * columns + x; const toCell = (point: Vec2) => ({ x: clamp(Math.round((point.x - minX) / step), 0, columns - 1), z: clamp(Math.round((point.z - minZ) / step), 0, rows - 1) }); const toPoint = (cell: { x: number; z: number }) => ({ x: minX + cell.x * step, z: minZ + cell.z * step }); const start = toCell(this.mower.position); const goal = toCell(this.level.start.dock); const open = [{ ...start, score: 0, estimate: 0 }]; const cameFrom = new Map<number, number>(); const cost = new Map<number, number>([[toIndex(start.x, start.z), 0]]); const visited = new Set<number>();
    while (open.length) { open.sort((a, b) => a.estimate - b.estimate); const current = open.shift()!; const currentId = toIndex(current.x, current.z); if (current.x === goal.x && current.z === goal.z) { const path: Vec2[] = []; let cursor = currentId; while (cursor !== toIndex(start.x, start.z)) { const x = cursor % columns; const z = Math.floor(cursor / columns); path.unshift(toPoint({ x, z })); cursor = cameFrom.get(cursor)!; } path.push(this.level.start.dock); return path; } if (visited.has(currentId)) continue; visited.add(currentId);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = current.x + dx; const z = current.z + dz; if (x < 0 || z < 0 || x >= columns || z >= rows) continue; const id = toIndex(x, z); const point = toPoint({ x, z }); if (this.blocked(point) || !this.pathClear(toPoint(current), point) || visited.has(id)) continue; const nextCost = (cost.get(currentId) ?? Infinity) + 1; if (nextCost >= (cost.get(id) ?? Infinity)) continue; cost.set(id, nextCost); cameFrom.set(id, currentId); open.push({ x, z, score: nextCost, estimate: nextCost + Math.abs(goal.x - x) + Math.abs(goal.z - z) }); }
    }
    return [this.level.start.dock];
  }
  private pathClear(from: Vec2, to: Vec2): boolean { return [0.25, 0.5, 0.75].every((ratio) => !this.blocked({ x: from.x + (to.x - from.x) * ratio, z: from.z + (to.z - from.z) * ratio })); }
  private followReturnPath(dt: number, maxSpeed: number): void {
    while (this.returnPath.length && distance(this.mower.position, this.returnPath[0]) < 0.32) this.returnPath.shift(); if (!this.returnPath.length) { this.returningToDock = false; this.mower.speed = 0; this.state.message = "Base reached: charging"; return; }
    const waypoint = this.returnPath[0]; const dx = waypoint.x - this.mower.position.x; const dz = waypoint.z - this.mower.position.z; const remaining = Math.hypot(dx, dz); const desired = Math.atan2(dx, dz); const difference = Math.atan2(Math.sin(desired - this.mower.angle), Math.cos(desired - this.mower.angle)); this.mower.angle += clamp(difference, -5 * dt, 5 * dt); const travel = Math.min(maxSpeed * 0.82 * dt, remaining); const next = { x: this.mower.position.x + (dx / remaining) * travel, z: this.mower.position.z + (dz / remaining) * travel }; if (this.blocked(next)) { this.returnPath = this.planReturnPath(); this.mower.speed = 0; } else { this.mower.position = next; this.mower.speed = travel / dt; }
  }
  private updateBattery(dt: number, cutting: boolean): void {
    const stats = this.stats; const isDocked = distance(this.mower.position, this.level.start.dock) < 1.3;
    if (isDocked) { if (!this.docked && this.state.batteryEnergy < this.state.batteryCapacity - 1) this.state.chargesUsed += 1; this.docked = true; this.state.batteryEnergy = Math.min(this.state.batteryCapacity, this.state.batteryEnergy + stats.rechargeRate * dt); if (this.state.reserveMode.active && this.state.batteryEnergy > 0.5) { this.state.reserveMode.active = false; this.state.reserveMode.secondsRemaining = 15; this.state.message = "Reserve cleared: charging"; } return; }
    this.docked = false; const moving = Math.abs(this.mower.speed) > 0.1; const drain = (moving ? 1 : 0.1) + (cutting ? 0.45 : 0) + (this.mower.speed < 0 ? 0.2 : 0); this.state.batteryEnergy = Math.max(0, this.state.batteryEnergy - drain * stats.drain * dt);
    if (this.state.batteryEnergy <= 0) { this.state.reserveMode.active = true; this.state.reserveMode.secondsRemaining -= dt; this.state.message = `Reserve mode: ${Math.ceil(this.state.reserveMode.secondsRemaining)}s to dock`; if (this.state.reserveMode.secondsRemaining <= 0) this.fail("Battery reserve expired"); }
    else if (this.state.batteryEnergy / this.state.batteryCapacity < 0.2) this.state.message = "Low battery: return to dock";
  }
  private updateRevealAndContacts(): void {
    const sensor = this.stats.sensorRadius;
    for (const hazard of this.level.hazards) { const runtime = this.hazards.get(hazard.id)!; if (runtime.hit) continue; const close = distance(this.mower.position, hazard.position); if (close < sensor || this.grass.centers.some((cell, index) => this.grass.states[index] === 2 && distance(cell, hazard.position) < hazard.revealRadius)) runtime.revealed = true; if (close < hazard.radius + 0.45) this.strike(hazard.id, `${hazard.type} hit`); }
    for (const collectible of this.level.collectibles) { if (this.collectibles.has(collectible.id)) continue; if (distance(this.mower.position, collectible.position) < 0.8) { this.collectibles.add(collectible.id); this.state.collectedThisRun.push(collectible.id); this.state.score += 750; this.state.message = "Upgrade part recovered"; } }
    for (const animal of this.animals) if (!animal.bumped && distance(this.mower.position, animal.position) < 0.75) { animal.bumped = true; animal.state = "flee"; this.strike(animal.id, `${animal.kind} startled safely`); }
  }
  private updateAnimals(dt: number): void { for (const animal of this.animals) { const away = distance(this.mower.position, animal.position); if (away < 3.2) animal.state = "flee"; else if (away > 4.5 && animal.state === "flee") animal.state = "return"; const target = animal.state === "flee" ? { x: animal.position.x + (animal.position.x - this.mower.position.x), z: animal.position.z + (animal.position.z - this.mower.position.z) } : animal.state === "return" ? animal.home : { x: animal.home.x + Math.sin(this.state.elapsedSeconds * 0.8 + animal.phase) * animal.roam, z: animal.home.z + Math.cos(this.state.elapsedSeconds * 0.65 + animal.phase) * animal.roam }; const dx = target.x - animal.position.x; const dz = target.z - animal.position.z; const length = Math.hypot(dx, dz) || 1; animal.position.x += (dx / length) * dt * (animal.state === "flee" ? 3.2 : 0.8); animal.position.z += (dz / length) * dt * (animal.state === "flee" ? 3.2 : 0.8); } }
  private strike(id: string, label: string): void { if (this.mower.invulnerable > 0 || this.state.hazardsHit.includes(id)) return; this.mower.invulnerable = 1.25; this.state.hazardsHit.push(id); const hazard = this.hazards.get(id); if (hazard) hazard.hit = true; this.state.strikesRemaining -= 1; this.state.score = Math.max(0, this.state.score - 350); this.state.multiplier = 1; this.streak = 0; this.state.message = `${label}: ${this.state.strikesRemaining} strikes left`; if (this.state.strikesRemaining <= 0) this.fail("Three strikes used"); }
  private complete(): void { this.state.status = "complete"; this.results = calculateResults({ cutCells: this.state.cutCells, completion: this.state.completionPercent, elapsed: this.state.elapsedSeconds, target: this.level.scoring.targetTimeSeconds, strikes: this.state.strikesRemaining, collectibles: this.collectibles.size, batteryPercent: (this.state.batteryEnergy / this.state.batteryCapacity) * 100, multiplier: this.state.multiplier, charges: this.state.chargesUsed }); this.state.score = this.results.score; this.state.message = this.results.perfect ? "Perfect Lawn" : "Lawn complete"; }
  private fail(message: string): void { this.state.status = "failed"; this.state.message = message; this.results = calculateResults({ cutCells: this.state.cutCells, completion: this.state.completionPercent, elapsed: this.state.elapsedSeconds, target: this.level.scoring.targetTimeSeconds, strikes: this.state.strikesRemaining, collectibles: this.collectibles.size, batteryPercent: 0, multiplier: this.state.multiplier, charges: this.state.chargesUsed }); }
  debug = { complete: () => { this.grass.cutAll(); this.state.cutCells = this.grass.cut; this.state.completionPercent = 100; this.complete(); }, setBatteryPercent: (percent: number) => { this.state.batteryEnergy = this.state.batteryCapacity * clamp(percent, 0, 100) / 100; }, teleportToDock: () => { this.mower.position = { ...this.level.start.dock }; }, teleportToHazard: () => { const hazard = this.level.hazards.find((item) => !this.hazards.get(item.id)?.hit); if (hazard) this.mower.position = { ...hazard.position }; } };
}
