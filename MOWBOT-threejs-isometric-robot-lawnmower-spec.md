# MOWBOT: Three.js Isometric Robot Lawnmower Vertical Slice Specification

This Markdown file is a complete handoff brief for Codex to build a web-based Three.js vertical slice game about a robot lawnmower. It is intended to be self-contained. Codex should be able to use this file as the primary implementation prompt without needing prior conversation context.

## 1. Product Vision

### Working Title

MOWBOT

### One-Sentence Pitch

An isometric arcade lawn-mowing game where the player pilots an upgradeable robot mower through detailed suburban and rural lawns, balancing clean mowing routes, battery management, hidden hazards, wildlife, collectibles, and score multipliers.

### Target Experience

The game should feel immediately understandable, satisfying, and replayable:

- Mowing grass should be visually satisfying every second.
- The player should constantly make small routing decisions.
- Hidden hazards should create tension without feeling unfair.
- Upgrades should make the mower feel meaningfully better.
- Each level should look and play differently.
- The vertical slice should be polished enough to prove the game concept on desktop and landscape mobile/tablet.

### Inspirations

Use these only as design references, not as direct copies:

- PowerWash Simulator: satisfying visible completion.
- Micro Machines: small vehicle navigation around oversized environments.
- Overcooked-style efficiency: route planning under pressure.
- Light RPG/garage progression: unlockable parts and stats.

### Platforms

Primary:

- Web browser.
- Desktop PC with keyboard.

Secondary from the start:

- Gamepad.
- Landscape tablet and phone.

The vertical slice does not need app-store packaging, but it should be implemented with responsive browser support and touch controls.

## 2. Game Pillars

### 1. Satisfying Coverage

The player should always understand what has been mowed and what remains. Grass should visibly change from long to cut, with a clear but attractive difference.

### 2. Clever Routing

The player should optimize:

- Which side of the property to mow first.
- When to return to the dock.
- Whether to risk mowing far corners on low battery.
- How to avoid hazards and animals.
- How to collect upgrade parts without wasting time.

### 3. Fair Surprise

Hidden objects in tall grass should create discovery and risk, but they must not feel random or cheap. There should be subtle visual or audio hints near hidden hazards.

### 4. Expressive Upgrades

Mower upgrades should affect both appearance and gameplay. Players should be able to change colors, body shapes, wheels/tracks, deck size, speed, battery, sensors, and cosmetic details.

### 5. Readable Isometric World

The scene should look rich but remain readable. Trees, roofs, and tall objects may occlude the mower, so the game must provide transparency, cutaway, outlines, or silhouette behavior.

## 3. Vertical Slice Scope

The vertical slice must include:

- A playable isometric Three.js game.
- Five selectable levels.
- One garage/customization screen.
- One results screen.
- Data-driven level definitions.
- Persistent save data.
- Mowing progress tracking.
- Battery and charging dock behavior.
- Three-strike failure system.
- Hidden and visible hazards.
- Animals with simple movement.
- Collectible mower parts.
- Basic upgrade progression.
- Keyboard, gamepad, and touch controls.
- Automated unit, integration, and browser smoke tests.
- A documented build/test/fix workflow.

The slice can use stylized low-poly or simple geometric art, but it must be visually coherent and polished.

## 4. Core Gameplay Loop

1. Player opens the game.
2. Player arrives at the main menu or level select.
3. Player selects a level.
4. Player optionally visits the garage to configure unlocked mower parts.
5. Player starts at the charging dock with a full battery.
6. Player drives the mower around the lawn.
7. Grass under the mower deck changes from uncut to cut.
8. Player earns points for newly cut grass.
9. Player avoids visible obstacles, hidden hazards, animals, house walls, trees, furniture, water, and other colliders.
10. Player may discover hidden upgrade parts in grass.
11. Player watches battery level and returns to dock when needed.
12. Dock recharges the mower.
13. Player completes the level by mowing at least 98 percent of mowable grass.
14. Player receives a results score based on completion, speed, efficiency, safety, battery use, and collectibles.
15. Player unlocks upgrades.
16. Player returns to level select or garage.
17. Player replays levels for better scores or moves to the next level.

## 5. Win, Lose, and Completion Rules

### Level Completion

A level is completed when:

- At least 98 percent of mowable grass cells have been cut.
- The mower is not currently destroyed.
- The three-strike counter has not reached zero.

At completion, the game should transition to a results screen.

### Perfect Lawn

Award a Perfect Lawn bonus if:

- 100 percent of mowable grass is cut.
- The player has at least one strike remaining.

### Failure

The level fails when any of the following happen:

- The player hits hazards or forbidden objects enough times to consume all three strikes.
- The battery reaches 0 percent away from the dock and reserve mode has already expired.
- The mower enters a death zone such as water, if the level defines one.

### Restart

On failure, present:

- Restart Level.
- Return to Level Select.
- Garage, if any unlocked upgrades are available.

## 6. Camera and Presentation

### View

Use an isometric 3D view:

- Orthographic camera.
- Slight downward angle.
- Camera follows mower smoothly.
- Camera can be offset ahead of movement direction if it improves playability.

Suggested starting camera:

- OrthographicCamera.
- Rotation around X about 55 to 60 degrees.
- Rotation around Y or scene orientation arranged for classic isometric view.
- Zoom tuned separately for desktop and mobile.

### Camera Behavior

Implement:

- Smooth follow.
- Bounds clamping so the player cannot see too far outside level bounds.
- Optional zoom levels for desktop.
- Responsive framing for landscape mobile.

### Visual Style

Use a polished low-poly or toy-like style:

- Bright but not childish.
- Readable lawns and objects.
- Strong color separation between cut grass, uncut grass, buildings, hazards, and collectibles.
- Avoid a one-note green palette by using complementary colors in flowers, houses, objects, UI, paths, and props.

## 7. Controls

### Keyboard

Required:

- W or Arrow Up: accelerate / move forward.
- S or Arrow Down: reverse / brake.
- A or Arrow Left: turn left.
- D or Arrow Right: turn right.
- Space: brake.
- E: interact with dock or collectible if needed.
- R: restart level after confirmation or on fail screen.
- Escape: pause.

Optional:

- Q/E: rotate camera slightly if implemented.
- Tab: toggle minimap or objective panel.

### Gamepad

Required:

- Left stick: steering and throttle, or twin-axis movement if using arcade movement.
- Right trigger: accelerate.
- Left trigger: brake/reverse.
- A / Cross: confirm.
- B / Circle: back.
- Start/Menu: pause.

The game should detect connected gamepads using the browser Gamepad API.

### Mobile / Tablet

Landscape support is required.

Controls:

- Virtual left joystick for movement.
- Optional right-side brake or boost button.
- Pause button in a corner.
- Large enough touch targets.
- UI safe-area padding for notches and browser bars.

Mobile controls should not cover critical mowing area. Use transparency and keep them near screen edges.

### Input Architecture

All inputs must flow through a shared input abstraction:

- KeyboardInputProvider.
- GamepadInputProvider.
- TouchInputProvider.
- InputManager.

Gameplay systems should consume a normalized input state:

```ts
type NormalizedInput = {
  steer: number;      // -1 left, 1 right
  throttle: number;   // 0 to 1
  brake: number;      // 0 to 1
  reverse: number;    // 0 to 1
  interact: boolean;
  pause: boolean;
};
```

## 8. Mower Gameplay

### Mower Movement Feel

The mower should feel like a small autonomous machine, not a race car.

Required behavior:

- Smooth acceleration.
- Turning radius affected by speed.
- Slight drift or inertia, but never so much that hazards feel unfair.
- Reverse movement.
- Reliable braking.
- Collision response that avoids tunneling through objects.

### Suggested Starting Stats

Base mower:

- Max speed: 4.0 units/sec.
- Acceleration: 7.0 units/sec squared.
- Reverse speed: 2.0 units/sec.
- Turn speed: 2.6 radians/sec.
- Deck width: 1.2 units.
- Battery capacity: 100 energy.
- Battery drain while moving: 1.0 energy/sec.
- Battery drain while cutting new grass: +0.45 energy/sec.
- Battery drain while idle: 0.1 energy/sec.
- Recharge rate at dock: 25 energy/sec.
- Sensor radius: 1.6 units.
- Strike count: 3.

### Mower Components

The mower should be assembled visually from interchangeable parts:

- Body shell.
- Color/material.
- Mobility part: wheels or tracks.
- Cutting deck.
- Battery module.
- Sensor module.
- Cosmetic topper or antenna.

Each part should be represented in save data and garage UI.

## 9. Grass and Mowing System

### Requirements

The grass system is the most important feature in the game.

It must:

- Track mowable space independently from visual mesh.
- Support cut and uncut state.
- Calculate completion percentage.
- Award points only once per newly cut area.
- Exclude buildings, paths, water, trunks, furniture, dock, and non-lawn regions.
- Be efficient enough for desktop and mobile.

### Recommended Implementation

Use a 2D grid overlay for grass state.

Each level defines:

- World width.
- World depth.
- Cell size.
- Mowable mask.
- Initial hidden hazard positions.
- Decorative grass rendering options.

Suggested cell size:

- Desktop vertical slice: 0.35 to 0.5 world units.
- Keep total cells reasonable. Aim under 25,000 mowable cells per level for the slice.

Cell states:

```ts
enum GrassCellState {
  NonMowable = 0,
  Uncut = 1,
  Cut = 2
}
```

Mowing process:

1. Convert mower deck footprint from world position into grid coordinates.
2. Find all cells overlapped by the mower deck.
3. For each Uncut cell, mark Cut.
4. Increment newly cut cell count.
5. Add points.
6. Trigger grass visual update.

### Cutting Footprint

Start with a circular or capsule-like footprint under the mower deck.

Deck upgrades may increase:

- Cutting radius.
- Cutting width.
- Cutting efficiency.
- Battery drain.

### Visual Grass Options

Acceptable vertical slice approaches:

- Instanced grass tiles with material changes.
- A plane using vertex colors or texture updates.
- Chunked grass meshes where chunks update when cells change.
- Simple square/hex patches if visually polished.

Do not update a unique mesh per cell if it causes performance problems.

Recommended approach:

- Use chunked instanced meshes or a canvas/data texture for grass state.
- Render uncut grass slightly taller/darker.
- Render cut grass shorter/lighter with visible mowing paths.

### Hidden Objects in Grass

Hidden objects should begin partially or fully obscured by tall grass.

Reveal behavior:

- When nearby grass cells are cut, reveal object mesh.
- When mower sensor detects the object, show a small warning indicator.
- If player hits hidden hazard, consume a strike and disintegrate or remove the object.

Hidden hazards must not be impossible to avoid. Use hints:

- Slight bump in grass.
- Small color variation.
- Subtle sparkle, outline, or sound cue if sensor module is near.
- Sensor upgrades make hints clearer and earlier.

## 10. Collision and Physics

### Physics Library

Use Rapier with Three.js:

- `@dimforge/rapier3d-compat`

Use Rapier for:

- Mower rigid body.
- Static colliders for houses, trunks, furniture, rocks, dock bounds, water boundaries, fences, and large objects.
- Sensor/collision detection.

### Collision Rules

The mower must not drive through:

- House walls.
- Tree trunks.
- Dock posts.
- Fences.
- Rocks.
- Patio furniture.
- Concrete geese.
- Hoses.
- Toys.
- Dog bowls.
- Animals.
- Water boundaries.
- Level boundary.

Some small hazards may disintegrate when hit, but collision should still register before removal.

### Collision Categories

Use clear categories:

- Mower.
- StaticObstacle.
- Hazard.
- Animal.
- Collectible.
- Dock.
- GrassSensor.
- LevelBoundary.

### Strike Collision

When the mower collides with a hazard:

1. Pause mower input briefly.
2. Trigger impact visual/audio feedback.
3. Remove or disintegrate the hit object if appropriate.
4. Subtract one strike.
5. Apply score penalty.
6. Grant a short invulnerability window so one collision cannot consume multiple strikes.
7. If strikes reach zero, fail the level.

Suggested invulnerability window:

- 1.25 seconds.

## 11. Three-Strike Failure System

The player starts every level with three strikes.

Strike-consuming events:

- Hitting hidden hazard.
- Hitting visible forbidden object.
- Hitting animal.
- Running into water or off-lawn danger zones.
- Running battery to zero after reserve mode expires.

Each strike should feel significant:

- Show a strike indicator in HUD.
- Flash mower or HUD on strike loss.
- Play impact effect.
- Display short message such as "Object hit - 2 strikes left".

When an object is hit:

- Most small objects disintegrate or scatter into pieces.
- Animals should not disintegrate. They should dodge, flee, or trigger a fail/strike with a non-graphic bump reaction.
- The tone must remain playful and non-violent.

## 12. Battery, Charging, and Reserve Mode

### Battery

Battery should drain based on activity:

- Moving drains energy.
- Cutting new grass drains extra energy.
- Reverse drains slightly more than forward.
- Upgraded heavy parts may increase drain.
- Better batteries increase capacity.

HUD must show:

- Battery percentage.
- Low battery warning.
- Direction or icon for dock if low.

### Charging Dock

Every level has a dock.

Dock behavior:

- The mower starts at the dock.
- Entering the dock zone begins charging after a short delay.
- Charging rate is shown in HUD.
- While docked, mower may be stationary or move slowly.
- Battery cannot exceed capacity.

### Reserve Mode

When battery reaches 0 away from dock:

1. Enter reserve mode instead of immediate fail.
2. Mower speed drops heavily.
3. Cutting deck turns off.
4. Player has a short emergency window to reach the dock.
5. If reserve timer expires before docking, fail the level.

Suggested reserve values:

- Reserve duration: 15 seconds.
- Max speed in reserve: 35 percent of normal.
- Deck disabled.

Reserve mode should create tension, not become a routine strategy.

## 13. Scoring and Multipliers

### Base Points

Award points for:

- Newly cut grass cells.
- Completion milestones.
- Hidden collectible pickups.
- Perfect Lawn.
- Finishing with strikes remaining.
- Finishing quickly.
- Efficient battery use.

Do not award points for driving over already-cut grass.

### Suggested Formula

At level end:

```ts
baseMowingScore = newlyCutCells * 10;
completionBonus = completionPercent >= 98 ? 2500 : 0;
perfectBonus = completionPercent >= 100 ? 2500 : 0;
strikeBonus = strikesRemaining * 1000;
collectibleBonus = collectedParts.length * 750;
timeBonus = Math.max(0, targetTimeSeconds - elapsedSeconds) * 25;
batteryBonus = Math.floor(totalBatteryRemainingAtFinishPercent * 20);

rawScore =
  baseMowingScore +
  completionBonus +
  perfectBonus +
  strikeBonus +
  collectibleBonus +
  timeBonus +
  batteryBonus;

finalScore = Math.floor(rawScore * multiplier);
```

### Multipliers

Start multiplier at 1.0.

Increase multiplier for:

- Cutting continuous new grass without hitting hazards.
- Completing mowing streaks.
- Avoiding repeat passes over already-cut grass.
- Finishing with no strikes lost.

Decrease or reset multiplier for:

- Hitting hazards.
- Running out of battery.
- Spending too much time idle.

Suggested:

- +0.05 every 100 newly cut cells in a streak.
- Cap normal multiplier at 3.0.
- Perfect Lawn can add +0.5 after cap.

### Results Screen

Show:

- Completion percentage.
- Final score.
- Time.
- Strikes remaining.
- Battery charges used.
- Collectibles found.
- Mowing efficiency.
- Rank.
- Newly unlocked upgrades.

Ranks:

- S: excellent score, high completion, no strikes.
- A: strong performance.
- B: completed with acceptable mistakes.
- C: barely completed.
- F: failed.

## 14. Upgrades, Garage, and Collectibles

### Garage Goals

The garage should let the player feel ownership over the mower.

Required garage features:

- View current mower.
- Rotate mower preview.
- Change unlocked color.
- Equip body shape.
- Equip wheels/tracks.
- Equip cutting deck.
- Equip battery.
- Equip sensor.
- See stat changes before confirming.
- Persist equipped loadout.

### Upgrade Categories

#### Colors

Examples:

- Factory Green.
- Safety Yellow.
- Racing Red.
- Midnight Blue.
- Orchard Orange.
- Chrome Trim.

Colors are mostly cosmetic, but rare colors may carry tiny bonuses only if desired later.

#### Body Shapes

Examples:

- Basic Box.
- Rounded Shell.
- Wedge Aero.
- Heavy Utility.
- Compact Scout.

Stats affected:

- Weight.
- Turn rate.
- Collision forgiveness.

#### Mobility

Examples:

- Standard Wheels.
- Grippy Tires.
- Turf Tracks.
- Precision Casters.

Stats affected:

- Acceleration.
- Turn speed.
- Stability.
- Battery drain.

#### Cutting Decks

Examples:

- Starter Deck.
- Wide Deck.
- Mulching Deck.
- Precision Edge Deck.

Stats affected:

- Deck width.
- Cut radius.
- Grass points.
- Battery drain.

#### Batteries

Examples:

- Stock Battery.
- Long Range Battery.
- Fast Charge Battery.
- Heavy Cell.

Stats affected:

- Capacity.
- Recharge rate.
- Weight.

#### Sensors

Examples:

- Basic Bumper.
- Hazard Ping.
- Wide Scan.
- Hidden Object Radar.

Stats affected:

- Hidden hazard reveal radius.
- Warning clarity.
- Animal detection.

### Collectibles

Collectibles are hidden in grass or placed near difficult route choices.

Types:

- Upgrade part.
- Cosmetic paint chip.
- Blueprint.
- Bonus battery cell.

Rules:

- A level should have 2 to 4 collectibles.
- Some should be easy.
- Some should reward exploration.
- Collectibles should save permanently.
- Collected items should not respawn unless the save is reset.

## 15. Animals

Animals add life, movement, and risk.

Required animals:

- Dog.
- Cat.
- Squirrel.

Optional:

- Birds as background decoration only.

### Animal Behavior

Animals should have simple state machines:

```ts
type AnimalState =
  | "idle"
  | "wander"
  | "alert"
  | "flee"
  | "return";
```

Behavior:

- Idle near home area.
- Wander along small paths.
- Become alert when mower approaches.
- Flee away from mower.
- Return after danger passes.

Collision with animals:

- Costs one strike.
- Animal should react by jumping/fleeing.
- No gore, no harm depiction, no disintegration.
- Use a playful non-graphic reaction.

Animals should generally try to avoid the mower so collisions feel avoidable.

## 16. Hazards and Obstacles

### Visible Obstacles

Examples:

- House.
- Garage.
- Porch.
- Fence.
- Dock.
- Tree trunks.
- Rocks.
- Patio furniture.
- Bird bath.
- Concrete goose.
- Garden gnome.
- Dog bowl.
- Lawn chair.
- Fire pit.
- Mailbox.

Visible obstacles should have colliders and should not be mowable.

### Hidden Hazards

Examples:

- Hose.
- Toy truck.
- Tennis ball.
- Fallen fruit.
- Dog leash.
- Sprinkler head.
- Small garden tool.
- Cat toy.

Hidden hazards should be revealed through mowing or sensors.

### Hazard Severity

For the vertical slice, all meaningful hazard hits cost one strike.

Future extension:

- Minor hazards reduce score only.
- Medium hazards cost strike.
- Major hazards cause instant fail or severe battery damage.

## 17. Tree, Canopy, and Roof Occlusion

The player must always be able to understand where the mower is, even under trees or behind buildings.

### Tree Design

Trees have:

- Solid trunk collider.
- Transparent or fadeable canopy.
- Optional fruit hazard spawns.

The mower cannot pass through trunks.

### Canopy Transparency

When the mower is under or behind a tree canopy:

- Fade canopy opacity to 30 to 45 percent.
- Keep trunk visible.
- Show mower outline or silhouette.

### Roof Occlusion

If the mower passes behind or near roof overhangs:

- Fade the roof or upper wall portion.
- Keep ground-level walls readable.
- Show mower silhouette if hidden.

### Implementation Option

Use an OcclusionSystem:

- Track occluder objects.
- Each frame, test camera-to-mower ray or projected screen overlap.
- Fade materials for occluders between camera and mower.
- Restore opacity when no longer occluding.

Occluders:

- Tree canopy.
- Roof.
- Tall shrubs.
- Pergola.

Do not fade critical colliders such as trunks entirely. The player must still understand what blocks movement.

## 18. Five Levels

All five levels must be selectable in the vertical slice. Level 1 should receive the most polish. Levels 2 to 5 can be smaller or simpler but must use the same systems and include distinct layouts, hazards, collectibles, and scoring targets.

### Level 1: Ranch House

Theme:

- Large ranch house with a wide yard.
- Trees the player must drive between.
- Dock near the house or garage.
- Hidden domestic hazards.

Required features:

- Large ranch house footprint.
- Front yard, side yard, and backyard zones.
- Driveway and walkway as non-mowable surfaces.
- Multiple trees with transparent canopies and solid trunks.
- Dock placed so route planning matters.
- Hidden hose.
- Hidden toys.
- Fallen fruit near trees.
- Concrete goose.
- Lawn furniture.
- Dog leash.
- Dog bowl.
- Cat.
- Squirrel.
- Dog that wanders near backyard.
- 3 collectibles.

Design goal:

- Teach all core systems in one level.
- Player should need at least one recharge unless very efficient or upgraded.

### Level 2: Cul-de-Sac Corner Lot

Theme:

- Suburban corner lot with sidewalks, mailbox, flowerbeds, and street edges.

Required features:

- L-shaped lawn around corner.
- Sidewalks and curb as non-mowable paths.
- Mailbox obstacle.
- Flowerbeds as forbidden zones.
- Sprinkler heads hidden in grass.
- Kids' toys near sidewalk.
- Cat moving between porch and shrubs.
- 2 collectibles.

Design goal:

- Teach edge mowing and precision routing.
- More narrow strips and corner turns than Level 1.

### Level 3: Orchard Yard

Theme:

- Fruit trees and uneven mowing paths.

Required features:

- Rows or clusters of trees.
- Many solid trunks.
- Transparent canopies.
- Fallen fruit hazards.
- Squirrels moving between trees.
- Garden cart.
- Water trough or pond edge.
- Dock at one side, forcing long routes.
- 3 collectibles.

Design goal:

- Emphasize occlusion, tree navigation, and hidden hazards.

### Level 4: Lakeside Cabin

Theme:

- Cabin lawn bordered by water and a dock.

Required features:

- Cabin footprint.
- Wooden dock as visible non-mowable surface.
- Water boundary or pond as danger zone.
- Rocks near shore.
- Lawn chairs.
- Fire pit.
- Dog bowl/leash near porch.
- Narrow grass path around cabin.
- 2 collectibles.

Design goal:

- Battery planning plus danger zones.
- Player must avoid sliding or steering into water.

### Level 5: Estate Challenge

Theme:

- Larger property combining previous mechanics.

Required features:

- Main house.
- Patio.
- Garden beds.
- Multiple tree clusters.
- Furniture.
- Animals.
- Hidden hose and toys.
- Fallen fruit.
- Long route back to dock.
- 4 collectibles.

Design goal:

- Final vertical slice challenge.
- Requires strong routing, recharging decisions, and hazard awareness.

## 19. Level Data Model

Use data-driven level definitions instead of hardcoding each level in scene setup.

Example:

```ts
export type LevelDefinition = {
  id: string;
  name: string;
  description: string;
  world: {
    width: number;
    depth: number;
    cellSize: number;
    boundaryPadding: number;
  };
  start: {
    mowerPosition: Vec3Tuple;
    mowerRotationY: number;
    dockId: string;
  };
  scoring: {
    targetTimeSeconds: number;
    parCharges: number;
    perfectCompletionPercent: number;
    requiredCompletionPercent: number;
  };
  grass: {
    regions: GrassRegionDefinition[];
    excludedRegions: RegionDefinition[];
  };
  objects: LevelObjectDefinition[];
  hazards: HazardDefinition[];
  animals: AnimalDefinition[];
  collectibles: CollectibleDefinition[];
  lighting: LightingDefinition;
};
```

Object definitions should include:

```ts
type LevelObjectDefinition = {
  id: string;
  type: string;
  position: Vec3Tuple;
  rotationY?: number;
  scale?: Vec3Tuple;
  collider: ColliderDefinition;
  occluder?: boolean;
  visibleFromStart?: boolean;
};
```

Hazard definitions should include:

```ts
type HazardDefinition = {
  id: string;
  type: "hose" | "toy" | "fruit" | "goose" | "furniture" | "leash" | "bowl" | "sprinkler" | "tool";
  position: Vec3Tuple;
  hidden: boolean;
  revealRadius: number;
  strikeCost: number;
  scorePenalty: number;
  disintegratesOnHit: boolean;
  collider: ColliderDefinition;
};
```

Collectible definitions should include:

```ts
type CollectibleDefinition = {
  id: string;
  unlockId: string;
  type: "part" | "paint" | "blueprint" | "batteryCell";
  position: Vec3Tuple;
  hidden: boolean;
  revealRadius: number;
};
```

## 20. Recommended Technology Stack

Use:

- TypeScript.
- Vite.
- Three.js.
- Rapier 3D.
- Zustand or a small custom store for game state.
- Vitest for unit and integration tests.
- Playwright for browser smoke tests.

Suggested dependencies:

```json
{
  "dependencies": {
    "@dimforge/rapier3d-compat": "latest",
    "three": "latest",
    "zustand": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@types/three": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

Avoid adding heavy frameworks unless necessary. A plain Vite app with TypeScript modules is preferred.

## 21. Recommended Architecture

### High-Level Modules

- App shell and screen routing.
- Three.js renderer.
- Physics world.
- Level loader.
- Grass grid.
- Mower controller.
- Collision system.
- Hazard system.
- Animal system.
- Battery system.
- Scoring system.
- Upgrade system.
- Save system.
- Input system.
- UI/HUD.
- Tests.

### Folder Structure

Recommended structure:

```txt
src/
  main.ts
  app/
    App.ts
    screens/
      MainMenuScreen.ts
      LevelSelectScreen.ts
      GarageScreen.ts
      GameScreen.ts
      ResultsScreen.ts
      PauseScreen.ts
  game/
    Game.ts
    GameLoop.ts
    GameState.ts
    constants.ts
  engine/
    renderer/
      Renderer.ts
      CameraRig.ts
      Lighting.ts
    physics/
      PhysicsWorld.ts
      colliders.ts
      collisionGroups.ts
    assets/
      Materials.ts
      MeshFactory.ts
      AssetRegistry.ts
  input/
    InputManager.ts
    KeyboardInputProvider.ts
    GamepadInputProvider.ts
    TouchInputProvider.ts
    types.ts
  levels/
    types.ts
    LevelLoader.ts
    levels/
      ranchHouse.ts
      culDeSac.ts
      orchardYard.ts
      lakesideCabin.ts
      estateChallenge.ts
  systems/
    GrassSystem.ts
    MowingSystem.ts
    MowerSystem.ts
    BatterySystem.ts
    ChargingSystem.ts
    CollisionSystem.ts
    HazardSystem.ts
    AnimalSystem.ts
    CollectibleSystem.ts
    OcclusionSystem.ts
    ScoringSystem.ts
    UpgradeSystem.ts
    SaveSystem.ts
  entities/
    Mower.ts
    Dock.ts
    LevelObject.ts
    Hazard.ts
    Animal.ts
    Collectible.ts
  ui/
    Hud.ts
    TouchControls.ts
    ScorePanel.ts
    BatteryMeter.ts
    StrikeMeter.ts
    Minimap.ts
    GaragePanel.ts
  data/
    upgrades.ts
    mowerParts.ts
    scoring.ts
  tests/
    setup.ts
test/
  unit/
  integration/
  browser/
public/
  assets/
```

### Important Architecture Rules

- Keep gameplay logic testable without rendering.
- Keep Three.js mesh creation separate from rules.
- Keep Rapier collider setup separate from level data.
- Keep level definitions data-driven.
- Keep save schema versioned.
- Avoid hardcoding specific level behavior in generic systems.
- Use deterministic test fixtures for grass, scoring, battery, collision, and save behavior.

## 22. State Model

Track game state explicitly:

```ts
type RunState = {
  levelId: string;
  status: "loading" | "playing" | "paused" | "complete" | "failed";
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
  reserveMode: {
    active: boolean;
    secondsRemaining: number;
  };
  collectedThisRun: string[];
  hazardsHit: string[];
};
```

## 23. Save System

Use browser localStorage for the vertical slice.

### Save Requirements

Save:

- Schema version.
- Unlocked levels.
- Best score per level.
- Best rank per level.
- Best completion per level.
- Collected upgrade IDs.
- Unlocked parts.
- Equipped parts.
- Settings.

Example:

```ts
type SaveData = {
  schemaVersion: 1;
  unlockedLevelIds: string[];
  levelRecords: Record<string, {
    bestScore: number;
    bestRank: "S" | "A" | "B" | "C" | "F";
    bestCompletionPercent: number;
    bestTimeSeconds: number | null;
    collectiblesFound: string[];
  }>;
  garage: {
    unlockedPartIds: string[];
    equipped: {
      body: string;
      color: string;
      mobility: string;
      deck: string;
      battery: string;
      sensor: string;
      cosmetic?: string;
    };
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
    cameraZoom: number;
  };
};
```

### Save Robustness

The save system must:

- Create default save if none exists.
- Validate loaded data.
- Recover gracefully from malformed localStorage.
- Preserve unknown future fields if practical.
- Include a dev reset button or query flag.

## 24. UI Requirements

### HUD

During gameplay show:

- Completion percentage.
- Score.
- Multiplier.
- Battery meter.
- Strike meter.
- Timer.
- Collectible count.
- Low battery warning.
- Reserve mode countdown.
- Dock direction indicator when battery is low.

### Pause Menu

Show:

- Resume.
- Restart Level.
- Garage.
- Level Select.
- Settings.

### Level Select

Show five level cards or rows:

- Level name.
- Completion status.
- Best rank.
- Best score.
- Collectibles found.
- Locked/unlocked state.

For the vertical slice, all five levels may be unlocked by default, but save data should support locked progression.

### Garage

Show:

- Mower preview.
- Part categories as tabs or segmented controls.
- Available parts.
- Locked parts.
- Current stats.
- Stat deltas.
- Equip button.

Use icons for UI buttons where practical.

## 25. Audio and Feedback

Audio may be simple generated or placeholder sounds, but feedback must exist.

Required feedback:

- Mower motor hum.
- Grass cutting sound.
- Collision impact.
- Collectible pickup.
- Dock charging.
- Low battery warning.
- Level complete.
- Strike lost.

Visual feedback:

- Grass cutting trail.
- Small particle burst when mowing.
- Hit particles for disintegrating small hazards.
- Collectible sparkle.
- Mower outline when occluded.
- Canopy/roof fade.
- Battery warning pulse.

## 26. Performance Targets

Target:

- Desktop: stable 60 FPS.
- Mobile/tablet landscape: stable 30 FPS minimum, 45 to 60 FPS preferred.
- Initial load under 5 seconds on a typical broadband connection.
- No obvious frame spikes when mowing many cells.

Technical constraints:

- Avoid one mesh per grass blade.
- Use instancing, chunking, or texture-driven grass.
- Pool particles.
- Avoid allocating large arrays every frame.
- Keep physics colliders simple.
- Use bounding checks before expensive calculations.

Performance tests should include:

- Level 1 loaded.
- Mower moving and cutting.
- 1000+ grass cells updated over a short period.
- Multiple animals active.
- Occlusion fading active.

## 27. Accessibility and Usability

Required:

- Clear color difference between cut and uncut grass.
- UI text readable on desktop and mobile.
- Button and touch target sizes appropriate for mobile.
- Pause available at all times.
- No required audio-only cues.
- Support reduced-motion setting by reducing particles/camera effects.

Optional:

- Colorblind-friendly grass contrast setting.
- Remappable controls.

## 28. Automated Testing Requirements

Codex must implement tests as it builds. Tests are not optional.

### Unit Tests

Use Vitest.

Required unit coverage:

- Grass grid initialization.
- Mowable vs non-mowable cells.
- Cutting footprint marks cells as cut.
- Cutting already-cut grass does not double score.
- Completion percentage calculation.
- Battery drain while idle, moving, cutting, and reserve.
- Charging behavior at dock.
- Reserve mode activation and failure.
- Scoring formula.
- Multiplier increments and resets.
- Strike system.
- Save load default.
- Save load malformed data recovery.
- Upgrade stat calculation.
- Level data validation.

### Integration Tests

Required integration coverage:

- Loading each of the five level definitions.
- Creating colliders from level objects.
- Mower spawn position at dock.
- Collectible pickup updates run state and save data.
- Hazard collision consumes exactly one strike during invulnerability window.
- Level completes at 98 percent.
- Perfect bonus applies at 100 percent.
- Battery reaches reserve and disables cutting.
- Dock exits reserve by charging.

### Browser Tests

Use Playwright.

Required smoke tests:

- App loads without console errors.
- Main menu or level select is visible.
- Start Level 1.
- Canvas renders nonblank.
- HUD is visible.
- Keyboard input moves mower.
- Grass completion increases after movement.
- Pause menu opens.
- Garage screen opens.
- Mobile landscape viewport shows touch controls.
- Results screen appears when test helper completes level.

### Browser Visual Verification

At minimum, write tests or scripts that:

- Capture desktop screenshot.
- Capture mobile landscape screenshot.
- Check that canvas is not blank.
- Check that no major HUD text overlaps at common viewport sizes.

Suggested viewports:

- 1440 x 900.
- 1024 x 768.
- 932 x 430 landscape mobile.
- 844 x 390 landscape mobile.

## 29. Implementation Order With Gates

Codex must build in phases. Do not move to the next phase until the current phase builds and its tests pass. If a phase fails, fix failures first.

### Phase 0: Project Setup

Tasks:

- Create Vite TypeScript project.
- Install Three.js, Rapier, Vitest, Playwright, and chosen state helper.
- Configure TypeScript.
- Configure test scripts.
- Add basic app shell.
- Add CI-like local command scripts.

Expected scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:browser": "playwright test",
    "check": "npm run build && npm run test && npm run test:browser"
  }
}
```

Acceptance criteria:

- App starts locally.
- Build passes.
- Unit test runner passes with at least one sanity test.
- Browser test runner can open the app.

Gate:

- Run build and tests.
- Fix all failures before Phase 1.

### Phase 1: Rendered Isometric World

Tasks:

- Create Three.js renderer.
- Create orthographic isometric camera.
- Add camera follow rig.
- Add lighting.
- Add simple ground plane.
- Add LevelLoader.
- Add Level 1 ranch house data.
- Render house, driveway, dock placeholder, trees, and obstacles.

Acceptance criteria:

- Level 1 loads from data.
- Camera follows placeholder mower.
- Trees have trunks and canopies.
- House and non-mowable surfaces are visually distinct.
- Browser screenshot shows nonblank isometric scene.

Gate:

- Build passes.
- Unit tests for level data validation pass.
- Browser smoke test for Level 1 render passes.

### Phase 2: Mower Movement and Physics

Tasks:

- Initialize Rapier.
- Add mower rigid body.
- Add static colliders for house, trunks, obstacles, and boundaries.
- Add normalized input manager.
- Implement keyboard controls.
- Implement camera follow on actual mower.
- Add collision response.

Acceptance criteria:

- Mower moves with keyboard.
- Mower cannot pass through house, tree trunks, or boundaries.
- Movement feels smooth and controllable.
- Camera follows without jitter.

Gate:

- Build passes.
- Movement-related unit/integration tests pass.
- Browser test confirms input moves mower and colliders stop movement.

### Phase 3: Grass and Mowing

Tasks:

- Implement GrassSystem grid.
- Define mowable and excluded regions.
- Implement MowingSystem.
- Render cut vs uncut grass.
- Add completion percent.
- Add base score for newly cut cells.
- Add HUD completion and score.

Acceptance criteria:

- Mower cuts grass under deck.
- Cut grass remains cut.
- Already-cut grass does not award repeat points.
- Non-mowable regions never count toward completion.
- Level can reach 98 percent completion through test helper.

Gate:

- Build passes.
- Grass unit tests pass.
- Integration tests for completion pass.
- Browser test confirms completion increases after movement.

### Phase 4: Battery, Dock, and Reserve

Tasks:

- Implement battery drain.
- Implement charging dock.
- Implement reserve mode.
- Add HUD battery meter.
- Add low battery warning.
- Add dock indicator when low.

Acceptance criteria:

- Battery drains while moving and cutting.
- Battery charges at dock.
- Reserve mode starts at 0 battery away from dock.
- Cutting stops in reserve.
- Level fails if reserve expires.

Gate:

- Build passes.
- Battery unit and integration tests pass.
- Browser test verifies low battery/reserve using test helper.

### Phase 5: Hazards, Strikes, and Object Reveal

Tasks:

- Implement hidden hazard data.
- Implement reveal behavior based on mowing and sensor radius.
- Implement strike counter.
- Implement collision penalty and invulnerability window.
- Implement disintegration/scatter effect for small hazards.
- Add HUD strike meter.

Acceptance criteria:

- Hidden hazards reveal fairly.
- Hazard collision consumes one strike.
- Same collision cannot drain multiple strikes during invulnerability.
- Three strikes fail level.
- Small hazards disappear or scatter after hit.

Gate:

- Build passes.
- Strike and hazard tests pass.
- Browser test verifies one strike loss from one collision.

### Phase 6: Animals

Tasks:

- Add animal entity and state machine.
- Add dog, cat, and squirrel definitions.
- Implement wander, alert, flee, and return behavior.
- Add animal colliders.
- Add non-graphic collision reaction and strike loss.

Acceptance criteria:

- Animals move in simple believable patterns.
- Animals avoid mower when approached.
- Collision costs one strike.
- Animals are never represented as harmed or destroyed.

Gate:

- Build passes.
- Animal behavior tests pass.
- Browser smoke test confirms animals spawn and update.

### Phase 7: Occlusion

Tasks:

- Implement OcclusionSystem.
- Fade tree canopies when mower is hidden.
- Fade roof/upper objects when needed.
- Add mower outline or silhouette.

Acceptance criteria:

- Mower remains understandable under trees.
- Tree trunks remain visible as blockers.
- Roof/canopy opacity restores after mower leaves.
- No distracting flicker.

Gate:

- Build passes.
- Occlusion logic tests pass where practical.
- Browser screenshot verifies mower visibility near tree/house.

### Phase 8: Scoring, Results, and Ranks

Tasks:

- Implement full scoring formula.
- Implement multiplier.
- Implement time, strike, battery, collectible, and perfect bonuses.
- Implement results screen.
- Implement ranks.

Acceptance criteria:

- Score updates during play.
- Results screen summarizes run clearly.
- Perfect Lawn bonus works at 100 percent.
- Rank calculation is deterministic and tested.

Gate:

- Build passes.
- Scoring tests pass.
- Browser test can trigger completion and see results.

### Phase 9: Garage, Upgrades, Collectibles, and Save

Tasks:

- Implement collectibles.
- Implement part unlocks.
- Implement garage UI.
- Implement stat calculation from equipped parts.
- Implement localStorage save system.
- Persist best scores and unlocks.

Acceptance criteria:

- Collectibles unlock upgrades.
- Garage equips unlocked parts.
- Stats change when parts are equipped.
- Save persists after reload.
- Malformed save recovers gracefully.

Gate:

- Build passes.
- Save and upgrade tests pass.
- Browser test verifies equip and reload persistence.

### Phase 10: Levels 2-5

Tasks:

- Add Cul-de-Sac Corner Lot.
- Add Orchard Yard.
- Add Lakeside Cabin.
- Add Estate Challenge.
- Add level-specific hazards, animals, collectibles, scoring targets, and dock positions.
- Ensure all levels use shared systems.

Acceptance criteria:

- All five levels are selectable and playable.
- Each level has distinct layout and hazards.
- Each level can be completed.
- Each level has collectibles.
- Level data validation passes.

Gate:

- Build passes.
- Integration tests load all levels.
- Browser smoke test starts each level.

### Phase 11: Polish and Performance

Tasks:

- Improve visuals.
- Add particles.
- Add audio feedback.
- Add mobile controls.
- Add gamepad support.
- Tune camera and movement.
- Optimize grass rendering.
- Add responsive HUD adjustments.

Acceptance criteria:

- Desktop and mobile viewports are playable.
- Canvas is nonblank in browser tests.
- HUD does not overlap controls or critical scene areas.
- Performance targets are met or documented with measured results.
- Gamepad input works if a gamepad is available or with mocked tests.

Gate:

- Full `npm run check` passes.
- Manual smoke test on desktop.
- Browser screenshots reviewed.

## 30. Codex Build Instructions

When Codex receives this file as the task brief, follow these instructions:

1. Read this entire file before coding.
2. Inspect the existing repository, if any.
3. If no project exists, create the Vite TypeScript project in the current workspace.
4. Use the recommended stack unless the existing project already has equivalent tooling.
5. Implement phase by phase.
6. After each phase, run the relevant tests and build.
7. If any command fails, fix the failure before moving on.
8. Do not skip tests to save time.
9. Do not move to the next phase while the current phase is broken.
10. Keep changes scoped to the phase.
11. Prefer data-driven systems over hardcoded level logic.
12. Keep gameplay logic testable without rendering.
13. Use browser tests to verify the canvas renders and core flows work.
14. Start the local dev server before final handoff, unless the user asks not to.
15. Provide the local URL and a concise summary of what was built.

### Required Final Verification

Before saying the task is complete, Codex must run:

```sh
npm run build
npm run test
npm run test:browser
```

If a combined script exists:

```sh
npm run check
```

Also perform a manual or automated browser verification:

- Load the game.
- Start Level 1.
- Move mower.
- Cut grass.
- Confirm HUD updates.
- Open pause menu.
- Open garage.
- Start at least one additional level.

Final response must include:

- What was built.
- What tests passed.
- Any known limitations.
- Local dev URL, if server is running.

## 31. Definition of Done

The vertical slice is done when all of the following are true:

- The game runs in browser.
- The player can select and play all five levels.
- Level 1 includes the ranch house, trees, hidden hazards, animals, dock, collectibles, mowing, battery, scoring, strikes, and occlusion.
- Levels 2 to 5 are playable and distinct.
- Mower movement works with keyboard.
- Gamepad input is implemented through the shared input layer.
- Landscape mobile touch controls are implemented.
- Grass visibly changes when mowed.
- Completion percentage is accurate.
- 98 percent completion ends a level.
- 100 percent completion grants Perfect Lawn.
- Battery drains, charges, and enters reserve mode.
- Running out of reserve fails the level.
- Hitting hazards consumes strikes.
- Three strikes fail the level.
- Hidden hazards reveal through mowing/sensors.
- Trees and roofs fade or outline correctly when occluding the mower.
- Garage allows equipping unlocked parts.
- Collectibles unlock upgrades.
- Save data persists progress.
- Results screen shows score, rank, time, completion, strikes, battery, and collectibles.
- Automated unit tests pass.
- Automated integration tests pass.
- Automated browser tests pass.
- Production build passes.
- Browser screenshots are nonblank and visually coherent on desktop and mobile landscape.
- No major console errors occur during normal play.

## 32. Recommended Initial Upgrade Data

Use this as a starting data set.

```ts
export const mowerParts = {
  bodies: [
    { id: "body_basic_box", name: "Basic Box", weight: 1.0, turnModifier: 1.0 },
    { id: "body_rounded_shell", name: "Rounded Shell", weight: 0.95, turnModifier: 1.05 },
    { id: "body_heavy_utility", name: "Heavy Utility", weight: 1.15, turnModifier: 0.92 }
  ],
  mobility: [
    { id: "mobility_standard_wheels", name: "Standard Wheels", accelerationModifier: 1.0, turnModifier: 1.0, drainModifier: 1.0 },
    { id: "mobility_grippy_tires", name: "Grippy Tires", accelerationModifier: 1.08, turnModifier: 1.08, drainModifier: 1.03 },
    { id: "mobility_turf_tracks", name: "Turf Tracks", accelerationModifier: 0.95, turnModifier: 0.9, drainModifier: 1.08 }
  ],
  decks: [
    { id: "deck_starter", name: "Starter Deck", widthModifier: 1.0, drainModifier: 1.0 },
    { id: "deck_wide", name: "Wide Deck", widthModifier: 1.25, drainModifier: 1.12 },
    { id: "deck_precision_edge", name: "Precision Edge Deck", widthModifier: 0.95, drainModifier: 0.95 }
  ],
  batteries: [
    { id: "battery_stock", name: "Stock Battery", capacityModifier: 1.0, rechargeModifier: 1.0, weightModifier: 1.0 },
    { id: "battery_long_range", name: "Long Range Battery", capacityModifier: 1.35, rechargeModifier: 0.9, weightModifier: 1.08 },
    { id: "battery_fast_charge", name: "Fast Charge Battery", capacityModifier: 1.05, rechargeModifier: 1.35, weightModifier: 1.0 }
  ],
  sensors: [
    { id: "sensor_basic", name: "Basic Bumper", revealRadiusModifier: 1.0 },
    { id: "sensor_hazard_ping", name: "Hazard Ping", revealRadiusModifier: 1.35 },
    { id: "sensor_wide_scan", name: "Wide Scan", revealRadiusModifier: 1.65 }
  ],
  colors: [
    { id: "color_factory_green", name: "Factory Green", color: "#43a047" },
    { id: "color_safety_yellow", name: "Safety Yellow", color: "#f9c74f" },
    { id: "color_racing_red", name: "Racing Red", color: "#d94141" },
    { id: "color_midnight_blue", name: "Midnight Blue", color: "#29335c" },
    { id: "color_orchard_orange", name: "Orchard Orange", color: "#f3722c" }
  ]
};
```

## 33. Recommended Level Unlocks

For the vertical slice:

- All levels may be unlocked by default for testing and demonstration.
- Collectibles should still unlock mower parts.

For future progression:

- Complete Level 1 to unlock Level 2.
- Complete Level 2 to unlock Level 3.
- Complete Level 3 to unlock Level 4.
- Complete Level 4 to unlock Level 5.
- Earn A rank or better to unlock special cosmetics.
- Find all collectibles in a level to unlock special parts.

## 34. Developer Test Helpers

Add test-only helpers gated behind development mode or test environment:

- Complete current level.
- Set battery percentage.
- Teleport mower to dock.
- Teleport mower to hazard.
- Unlock all garage parts.
- Reset save.

These helpers should not be visible in production UI unless explicitly enabled by query parameter:

```txt
?debug=1
```

Browser tests may use these helpers to avoid long manual mowing sessions.

## 35. Non-Goals for the First Vertical Slice

Do not spend time on these until the vertical slice works:

- Online multiplayer.
- Account login.
- Cloud saves.
- Procedural level generation.
- Realistic grass blade simulation.
- Complex animal AI.
- In-game currency shop.
- Full story/campaign cinematics.
- Native mobile packaging.
- Advanced terrain deformation.

## 36. Known Risks and Mitigations

### Risk: Grass Rendering Performance

Mitigation:

- Use grid state separate from visuals.
- Use chunked updates.
- Avoid per-cell mesh churn.
- Profile early on Level 1.

### Risk: Hidden Hazards Feel Unfair

Mitigation:

- Add subtle hints.
- Use sensor reveal radius.
- Place hazards in learnable patterns.
- Do not place hazards directly in unavoidable paths.

### Risk: Occlusion Makes Navigation Confusing

Mitigation:

- Fade canopies/roofs.
- Add mower outline.
- Keep trunks visible.
- Test with screenshots.

### Risk: Scope Creep

Mitigation:

- Build phase by phase.
- Keep Level 1 most polished.
- Let Levels 2 to 5 reuse systems.
- Treat art as stylized placeholders unless system behavior needs polish.

### Risk: Mobile Controls Cover Gameplay

Mitigation:

- Use edge-aligned transparent controls.
- Test landscape mobile viewports.
- Keep critical HUD away from joystick areas.

## 37. Suggested First Milestone

If time is limited, the first milestone should be:

- Vite TypeScript app.
- Three.js isometric scene.
- Level 1 ranch house layout.
- Keyboard-controlled mower.
- Grass cutting grid.
- Completion HUD.
- Basic colliders.
- Local build and browser smoke test.

This milestone proves the core feel. After that, add battery, hazards, scoring, upgrades, and additional levels.

## 38. Final Instruction to Codex

Build the game, not just a prototype menu. The first screen after loading should quickly lead into playable mowing. Every system should be implemented in a way that can grow, but the vertical slice must be playable end to end.

Work in small phases, test after each phase, fix failures immediately, and only then continue.
