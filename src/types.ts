export type Vec2 = { x: number; z: number };
export type Rank = "S" | "A" | "B" | "C" | "F";
export type RunStatus = "playing" | "paused" | "complete" | "failed" | "stopped";
export type AnimalKind = "dog" | "cat" | "squirrel";
export type LawnDropKind = "fruit" | "frisbee" | "ball" | "animal";
export type Collider =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; depth: number };
export type Region = { kind: "circle"; center: Vec2; radius: number } | { kind: "rect"; center: Vec2; width: number; depth: number };

export interface LevelObject {
  id: string;
  type: "house" | "cabin" | "tree" | "rock" | "fence" | "furniture" | "mailbox" | "garden" | "patio" | "driveway" | "dock" | "water" | "firepit" | "shrub";
  position: Vec2;
  collider: Collider;
  occluder?: boolean;
  color?: string;
}

export interface Hazard {
  id: string;
  type: "hose" | "toy" | "fruit" | "goose" | "furniture" | "leash" | "bowl" | "sprinkler" | "tool";
  position: Vec2;
  radius: number;
  hidden: boolean;
  revealRadius: number;
  scorePenalty: number;
  disintegratesOnHit: boolean;
}

export interface AnimalDefinition { id: string; kind: AnimalKind; home: Vec2; roam: number; }
export interface Collectible { id: string; unlockId: string; position: Vec2; hidden: boolean; revealRadius: number; }
export interface LawnDrop { id: string; kind: LawnDropKind; name: string; position: Vec2; radius: number; collected: boolean; carried: boolean; delivered: boolean; }
export interface LawnInspection { name: string; model: string; detail: string; kind: "mower" | "object" | "hazard" | "animal" | "upgrade" | "drop"; visual: string; }
export interface TallGrassPatch { id: string; name: string; center: Vec2; width: number; depth: number; passesRequired: number; speedMultiplier: number; }

export interface LevelDefinition {
  id: string;
  name: string;
  description: string;
  world: { width: number; depth: number; cellSize: number; boundaryPadding: number };
  start: { position: Vec2; rotation: number; dock: Vec2 };
  scoring: { targetTimeSeconds: number; parCharges: number; requiredCompletionPercent: number };
  excluded: Region[];
  objects: LevelObject[];
  hazards: Hazard[];
  animals: AnimalDefinition[];
  collectibles: Collectible[];
  tallGrassPatches: TallGrassPatch[];
  sky: string;
}

export interface NormalizedInput { steer: number; throttle: number; brake: number; reverse: number; interact: boolean; pause: boolean; }
export interface EquippedLoadout { body: string; color: string; mobility: string; deck: string; battery: string; sensor: string; dock: string; arms: string; }
export interface MowerStats { maxSpeed: number; acceleration: number; turnSpeed: number; deckRadius: number; capacity: number; rechargeRate: number; drain: number; sensorRadius: number; color: string; tracks: boolean; arms: string; pickupRadius: number; basketCapacity: number; }
export interface RunState {
  levelId: string;
  status: RunStatus;
  elapsedSeconds: number;
  completionPercent: number;
  cutCells: number;
  totalMowableCells: number;
  score: number;
  multiplier: number;
  strikesRemaining: number;
  batteryEnergy: number;
  batteryCapacity: number;
  chargesUsed: number;
  reserveMode: { active: boolean; secondsRemaining: number };
  collectedThisRun: string[];
  carriedItems: string[];
  deliveredItems: number;
  tallGrassPasses: Record<string, number>;
  hazardsHit: string[];
  message: string;
}

export interface Results { score: number; rank: Rank; perfect: boolean; efficiency: number; completion: number; time: number; strikes: number; charges: number; collectibles: number; battery: number; }
export interface SaveData {
  schemaVersion: 1;
  unlockedLevelIds: string[];
  levelRecords: Record<string, { bestScore: number; bestRank: Rank; bestCompletionPercent: number; bestTimeSeconds: number | null; collectiblesFound: string[] }>;
  garage: { unlockedPartIds: string[]; equipped: EquippedLoadout };
  settings: { cameraZoom: number };
}
