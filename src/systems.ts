import { allPartIds, starterLoadout } from "./data/upgrades";
import type { EquippedLoadout, Rank, Region, Results, SaveData, Vec2 } from "./types";

export enum GrassCellState { NonMowable, Uncut, Cut }
const inRegion = (p: Vec2, region: Region) => region.kind === "circle" ? Math.hypot(p.x - region.center.x, p.z - region.center.z) <= region.radius : Math.abs(p.x - region.center.x) <= region.width / 2 && Math.abs(p.z - region.center.z) <= region.depth / 2;
export const distance = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z);

export class GrassGrid {
  readonly cols: number; readonly rows: number; readonly states: Uint8Array; readonly centers: Vec2[] = []; total = 0; cut = 0;
  constructor(readonly width: number, readonly depth: number, readonly cellSize: number, excluded: Region[]) {
    this.cols = Math.ceil(width / cellSize); this.rows = Math.ceil(depth / cellSize); this.states = new Uint8Array(this.cols * this.rows);
    for (let row = 0; row < this.rows; row += 1) for (let col = 0; col < this.cols; col += 1) {
      const point = { x: -width / 2 + (col + 0.5) * cellSize, z: -depth / 2 + (row + 0.5) * cellSize }; const index = row * this.cols + col; this.centers[index] = point;
      if (!excluded.some((region) => inRegion(point, region))) { this.states[index] = GrassCellState.Uncut; this.total += 1; }
    }
  }
  cutFootprint(point: Vec2, radius: number): number {
    let gained = 0; const range = Math.ceil(radius / this.cellSize) + 1; const col = Math.floor((point.x + this.width / 2) / this.cellSize); const row = Math.floor((point.z + this.depth / 2) / this.cellSize);
    for (let z = Math.max(0, row - range); z <= Math.min(this.rows - 1, row + range); z += 1) for (let x = Math.max(0, col - range); x <= Math.min(this.cols - 1, col + range); x += 1) {
      const index = z * this.cols + x; if (this.states[index] === GrassCellState.Uncut && distance(point, this.centers[index]) <= radius) { this.states[index] = GrassCellState.Cut; gained += 1; }
    }
    this.cut += gained; return gained;
  }
  cutAll(): void { for (let index = 0; index < this.states.length; index += 1) if (this.states[index] === GrassCellState.Uncut) this.states[index] = GrassCellState.Cut; this.cut = this.total; }
  get completion(): number { return this.total ? (this.cut / this.total) * 100 : 0; }
}

export function calculateResults(input: { cutCells: number; completion: number; elapsed: number; target: number; strikes: number; collectibles: number; batteryPercent: number; multiplier: number; charges: number }): Results {
  const completionBonus = input.completion >= 98 ? 2500 : 0; const perfect = input.completion >= 100 && input.strikes > 0; const perfectBonus = perfect ? 2500 : 0;
  const score = Math.floor((input.cutCells * 10 + completionBonus + perfectBonus + input.strikes * 1000 + input.collectibles * 750 + Math.max(0, input.target - input.elapsed) * 25 + Math.floor(input.batteryPercent * 20)) * input.multiplier);
  const rank: Rank = input.completion < 98 ? "F" : input.strikes === 3 && input.completion >= 99 ? "S" : score > 11_000 ? "A" : score > 7_500 ? "B" : "C";
  return { score, rank, perfect, efficiency: input.cutCells / Math.max(1, Math.round(input.elapsed * 5)), completion: input.completion, time: input.elapsed, strikes: input.strikes, charges: input.charges, collectibles: input.collectibles, battery: input.batteryPercent };
}

export const SAVE_KEY = "mowbot-save-v1";
export const defaultSave = (): SaveData => ({ schemaVersion: 1, unlockedLevelIds: ["ranch-house", "cul-de-sac", "orchard-yard", "lakeside-cabin", "estate-challenge"], levelRecords: {}, garage: { unlockedPartIds: ["body_basic_box", "color_factory_green", "mobility_standard_wheels", "deck_starter", "battery_stock", "sensor_basic"], equipped: { ...starterLoadout } }, settings: { cameraZoom: 1 } });
export function loadSave(storage: Pick<Storage, "getItem"> = localStorage): SaveData { try { const raw = storage.getItem(SAVE_KEY); if (!raw) return defaultSave(); const parsed = JSON.parse(raw) as Partial<SaveData>; if (parsed.schemaVersion !== 1 || !parsed.garage?.equipped || !Array.isArray(parsed.garage.unlockedPartIds)) return defaultSave(); return { ...defaultSave(), ...parsed, garage: { ...defaultSave().garage, ...parsed.garage, equipped: { ...starterLoadout, ...parsed.garage.equipped } } }; } catch { return defaultSave(); } }
export function persistSave(save: SaveData, storage: Pick<Storage, "setItem"> = localStorage): void { storage.setItem(SAVE_KEY, JSON.stringify(save)); }
export function unlockAll(save: SaveData): SaveData { return { ...save, garage: { ...save.garage, unlockedPartIds: [...new Set([...save.garage.unlockedPartIds, ...allPartIds])] } }; }
export function equip(save: SaveData, category: keyof EquippedLoadout, id: string): SaveData { if (!save.garage.unlockedPartIds.includes(id)) return save; return { ...save, garage: { ...save.garage, equipped: { ...save.garage.equipped, [category]: id } } }; }
