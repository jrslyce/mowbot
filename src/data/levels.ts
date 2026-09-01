import type { AnimalDefinition, Collider, Collectible, Hazard, LevelDefinition, LevelObject, Region, TallGrassPatch, Vec2 } from "../types";

const circle = (radius: number): Collider => ({ kind: "circle", radius });
const rect = (width: number, depth: number): Collider => ({ kind: "rect", width, depth });
const excluded = (objects: LevelObject[]): Region[] => objects.filter((object) => ["house", "cabin", "driveway", "patio", "garden", "dock", "water"].includes(object.type)).map((object) => object.collider.kind === "circle" ? { kind: "circle", center: object.position, radius: object.collider.radius } : { kind: "rect", center: object.position, width: object.collider.width, depth: object.collider.depth });
const tree = (id: string, x: number, z: number): LevelObject => ({ id, type: "tree", position: { x, z }, collider: circle(0.6), occluder: true });
const obj = (id: string, type: LevelObject["type"], x: number, z: number, collider: Collider, color?: string): LevelObject => ({ id, type, position: { x, z }, collider, color, occluder: type === "house" || type === "cabin" || type === "shrub" });
const hazard = (id: string, type: Hazard["type"], x: number, z: number, hidden = true): Hazard => ({ id, type, position: { x, z }, radius: type === "hose" ? 0.8 : 0.45, hidden, revealRadius: 1.3, scorePenalty: 350, disintegratesOnHit: type !== "bowl" });
const collect = (id: string, unlockId: string, x: number, z: number, hidden = true): Collectible => ({ id, unlockId, position: { x, z }, hidden, revealRadius: 1.15 });
const animal = (id: string, kind: AnimalDefinition["kind"], x: number, z: number): AnimalDefinition => ({ id, kind, home: { x, z }, roam: kind === "dog" ? 3 : 2 });
const tallGrass = (id: string, name: string, x: number, z: number, width: number, depth: number, passesRequired = 3): TallGrassPatch => ({ id, name, center: { x, z }, width, depth, passesRequired, speedMultiplier: 0.42 });

function level(id: string, name: string, description: string, width: number, depth: number, dock: Vec2, objects: LevelObject[], hazards: Hazard[], animals: AnimalDefinition[], collectibles: Collectible[], sky: string, tallGrassPatches: TallGrassPatch[]): LevelDefinition {
  const dockObject = obj("dock", "dock", dock.x, dock.z, rect(2.2, 1.6), "#5b6f7b");
  const allObjects = [...objects, dockObject];
  return { id, name, description, world: { width, depth, cellSize: 0.45, boundaryPadding: 0.65 }, start: { position: { ...dock }, rotation: 0, dock }, scoring: { targetTimeSeconds: Math.round(width * depth * 0.58), parCharges: 1, requiredCompletionPercent: 98 }, excluded: excluded(allObjects), objects: allObjects, hazards, animals, collectibles, tallGrassPatches, sky };
}

export const levels: LevelDefinition[] = [
  level("ranch-house", "Ranch House", "Wide yard, hidden domestic hazards, and a recharge route.", 30, 24, { x: -10.8, z: -7.8 }, [
    obj("ranch", "house", 3.8, -1.8, rect(10, 6.2), "#d66b55"), obj("drive", "driveway", -2.5, -7.3, rect(10, 4), "#8b9496"), obj("porch", "patio", 4.5, -5.8, rect(4, 1.8), "#bd9165"),
    tree("tree-a", -8, 6.5), tree("tree-b", -4.8, 8.1), tree("tree-c", 10.6, 7.2), tree("tree-d", 11.4, -8.7), obj("goose", "furniture", -1.1, 3, circle(0.45)), obj("chair", "furniture", 8.7, -7.1, rect(1.4, 1.2))
  ], [hazard("hose", "hose", -6, -2.4), hazard("truck", "toy", -8.7, 1.5), hazard("fruit", "fruit", 10.2, 5.3), hazard("leash", "leash", 8.2, -5.5)], [animal("cat", "cat", -2.4, 7), animal("squirrel", "squirrel", 9.4, 5.6), animal("dog", "dog", -8.4, -5.2)], [collect("ranch-paint", "color_safety_yellow", -10.2, 7.6), collect("ranch-deck", "deck_wide", 12.3, 8), collect("ranch-sensor", "sensor_hazard_ping", -11.2, 1.7), collect("ranch-chrome", "color_chrome_trim", 12.4, -2.2)], "#a5d7ed", [tallGrass("ranch-side-strip", "Side-yard tall grass", -7, 3.5, 4.2, 3.2), tallGrass("ranch-back-strip", "Back-lot tall grass", 9.5, 5.5, 4.5, 3.4)]),
  level("cul-de-sac", "Cul-de-Sac", "Narrow strips reward patient, precise turns.", 27, 22, { x: -9, z: -7 }, [
    obj("corner-home", "house", 5, 2, rect(8, 7), "#e9a65d"), obj("sidewalk", "driveway", -1, -7, rect(24, 2.2), "#d5d4ca"), obj("street", "driveway", -10.5, 1, rect(2.5, 15), "#6e7781"), obj("mailbox", "mailbox", -6, 3.5, circle(0.42)), obj("bed-a", "garden", 5, 6.5, rect(8, 1.3), "#b34d60"), tree("corner-tree", 10, -5)
  ], [hazard("sprinkler-a", "sprinkler", -2, 4), hazard("sprinkler-b", "sprinkler", 7, -5), hazard("toy-b", "toy", -7.5, 7)], [animal("corner-cat", "cat", 8.5, 7)], [collect("corner-mobility", "mobility_grippy_tires", -7.5, 7.8), collect("corner-red", "color_racing_red", 9.5, -8), collect("corner-dock-round", "dock_round_plaza", -4, -7), collect("corner-dock-signal", "dock_signal_beacon", 3, -7)], "#bcdbe4", [tallGrass("cul-west-strip", "West-side tall grass", -5.5, 4.5, 3.8, 2.5)]),
  level("orchard-yard", "Orchard Yard", "Tree rows, fallen fruit, and a long dock return.", 31, 25, { x: -12, z: -9 }, [
    obj("shed", "cabin", -5.5, -4, rect(5, 4), "#ae6b45"), obj("trough", "water", 11, -7.5, rect(5, 2), "#4b91b6"), obj("cart", "furniture", 6, 8, rect(2, 1.3)),
    tree("orch-1", -7, 6), tree("orch-2", -2, 7), tree("orch-3", 3, 6), tree("orch-4", 8, 7), tree("orch-5", -5, 1), tree("orch-6", 1, 0), tree("orch-7", 7, 1)
  ], [hazard("fruit-1", "fruit", -7, 4.8), hazard("fruit-2", "fruit", 2, -1.3), hazard("fruit-3", "fruit", 7, 2.5), hazard("tool", "tool", 11, 6)], [animal("orch-sq-1", "squirrel", -2, 5.5), animal("orch-sq-2", "squirrel", 7, 6)], [collect("orch-battery", "battery_long_range", 12, 8), collect("orch-tracks", "mobility_turf_tracks", -11, 7), collect("orch-blue", "color_midnight_blue", 11, -2), collect("orch-wedge", "body_wedge_aero", -12, 2.5)], "#f3d8a7", [tallGrass("orchard-south-strip", "South orchard tall grass", -9, -1, 4, 3.2), tallGrass("orchard-east-strip", "East orchard tall grass", 11, 3.5, 3.6, 4, 4)]),
  level("lakeside-cabin", "Lakeside Cabin", "Tight mowing around a cabin and an unforgiving shoreline.", 26, 23, { x: -8.5, z: 7.8 }, [
    obj("cabin", "cabin", 1, 1, rect(8, 6), "#a76443"), obj("lake", "water", 9.5, -5.5, rect(12, 11), "#3f95be"), obj("wood-dock", "patio", 4.5, -5.2, rect(4, 1.7), "#a98058"), obj("fire", "firepit", -5, -6, circle(1)), obj("chair-l", "furniture", -5, -3.8, rect(1.3, 1.3)), tree("cabin-tree", -8, -1.5), tree("cabin-tree-2", -7, 5)
  ], [hazard("cabin-leash", "leash", -1.5, -3.8), hazard("cabin-bowl", "bowl", -3.5, 2), hazard("cabin-tool", "tool", -8.3, -7.5)], [animal("cabin-dog", "dog", -3, 3)], [collect("cabin-fast", "battery_fast_charge", -8.6, -7.7), collect("cabin-edge", "deck_precision_edge", -7.8, 7.4), collect("cabin-scout", "body_compact_scout", 11, 7.5), collect("cabin-dock-solar", "dock_solar_canopy", -2, 8)], "#c6dded", [tallGrass("cabin-lawn-strip", "Cabin-side tall grass", -5, 3.5, 3.5, 3)]),
  level("estate-challenge", "Estate Challenge", "A large property where every system earns its place.", 34, 27, { x: -13.2, z: -9 }, [
    obj("estate", "house", 3, 0, rect(11, 7), "#d79c59"), obj("patio", "patio", 4, -5, rect(7, 2), "#bb8762"), obj("beds", "garden", 11, 7, rect(6, 3), "#b6536c"), obj("furn", "furniture", -4, 7, rect(2, 2)), tree("estate-1", -10, 7), tree("estate-2", -6, 7), tree("estate-3", 11, -7), tree("estate-4", 14, 3), tree("estate-5", -10, -4)
  ], [hazard("estate-hose", "hose", -4, -2), hazard("estate-toy", "toy", -11, 2), hazard("estate-fruit", "fruit", 12, -5), hazard("estate-sprinkler", "sprinkler", 11, 2), hazard("estate-leash", "leash", 0, 7)], [animal("estate-dog", "dog", -8, -7), animal("estate-cat", "cat", 12, 6), animal("estate-sq", "squirrel", -7, 5)], [collect("estate-orange", "color_orchard_orange", -12, 7), collect("estate-shell", "body_rounded_shell", 14, -8), collect("estate-heavy", "body_heavy_utility", 14, 8), collect("estate-wide-sensor", "sensor_wide_scan", -13, -1)], "#e9c8a1", [tallGrass("estate-west-strip", "West estate tall grass", -9, 1.5, 4.2, 3.5, 4), tallGrass("estate-east-strip", "East estate tall grass", 12, -2, 4, 3.2)])
];

export const getLevel = (id: string) => levels.find((level) => level.id === id) ?? levels[0];
export function validateLevel(level: LevelDefinition): string[] {
  const errors: string[] = [];
  if (level.world.width <= 0 || level.world.depth <= 0 || level.world.cellSize <= 0) errors.push("invalid world dimensions");
  if (!level.objects.some((object) => object.type === "dock")) errors.push("missing dock");
  if (level.collectibles.length < 2 || level.collectibles.length > 4) errors.push("invalid collectible count");
  if (level.scoring.requiredCompletionPercent !== 98) errors.push("completion threshold must be 98");
  return errors;
}
