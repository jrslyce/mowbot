import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { getPartName } from "./data/upgrades";
import { GameEngine } from "./engine";
import { GrassCellState } from "./systems";
import type { LawnDrop, LawnInspection, TallGrassPatch } from "./types";

type MaterialMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
type ImportedAssetKey = "dock-basic" | "ranch-house" | "cabin" | "tree" | "dog" | "cat" | "squirrel";
const importedAssetUrls: Record<ImportedAssetKey, string> = {
  "dock-basic": "/assets/models/dock-basic.glb",
  "ranch-house": "/assets/models/ranch-house.glb",
  cabin: "/assets/models/cabin.glb",
  tree: "/assets/models/tree.glb",
  dog: "/assets/models/dog.glb",
  cat: "/assets/models/cat.glb",
  squirrel: "/assets/models/squirrel.glb",
};
const material = (color: string, roughness = 0.85, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
const mesh = (geometry: THREE.BufferGeometry, color: string, roughness = 0.85, metalness = 0) => new THREE.Mesh(geometry, material(color, roughness, metalness));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export class IsometricRenderer {
  readonly scene = new THREE.Scene(); readonly renderer: THREE.WebGLRenderer; readonly camera: THREE.OrthographicCamera; readonly mower = new THREE.Group();
  private grassTexture!: THREE.CanvasTexture; private grassContext!: CanvasRenderingContext2D; private grassImage!: ImageData; private grassSnapshot: Uint8Array; private hazards = new Map<string, THREE.Object3D>(); private collectibles = new Map<string, THREE.Object3D>(); private animals = new Map<string, THREE.Object3D>(); private drops = new Map<string, THREE.Object3D>(); private tallGrass = new Map<string, THREE.Group>(); private occluders: THREE.Group[] = []; private inspectables: THREE.Object3D[] = []; private raycaster = new THREE.Raycaster(); private pointer = new THREE.Vector2(); private hazardPingLights: MaterialMesh[] = []; private target = new THREE.Vector3(); private modelLoader = new GLTFLoader(); private modelLoads = new Map<ImportedAssetKey, Promise<THREE.Group>>(); private modelQueue: Array<{ key: ImportedAssetKey; resolve: (model: THREE.Group) => void; reject: (error: unknown) => void }> = []; private modelQueueTimer?: number;
  constructor(private host: HTMLElement, readonly engine: GameEngine) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; this.host.append(this.renderer.domElement);
    this.camera = new THREE.OrthographicCamera(-12, 12, 8, -8, 0.1, 100); this.camera.position.set(18, 21, 18); this.scene.background = new THREE.Color(engine.level.sky); this.scene.fog = new THREE.Fog(engine.level.sky, 34, 58); this.grassSnapshot = new Uint8Array(engine.grass.states.length);
    this.scene.add(new THREE.HemisphereLight("#eaf9ff", "#58724d", 2.1)); const sun = new THREE.DirectionalLight("#fff0cc", 3.2); sun.position.set(-12, 24, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); this.scene.add(sun); this.createWorld(); this.resize(); window.addEventListener("resize", this.resize);
  }
  private createWorld(): void {
    const level = this.engine.level; const floor = mesh(new THREE.PlaneGeometry(level.world.width + 8, level.world.depth + 8), "#4d653f"); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.08; this.scene.add(floor);
    const canvas = document.createElement("canvas"); canvas.width = this.engine.grass.cols; canvas.height = this.engine.grass.rows; this.grassContext = canvas.getContext("2d")!; this.grassImage = this.grassContext.createImageData(canvas.width, canvas.height); this.paintGrass(); this.grassContext.putImageData(this.grassImage, 0, 0); this.grassTexture = new THREE.CanvasTexture(canvas); this.grassTexture.colorSpace = THREE.SRGBColorSpace; this.grassTexture.magFilter = THREE.NearestFilter; this.grassTexture.minFilter = THREE.NearestFilter; const grass = new THREE.Mesh(new THREE.PlaneGeometry(level.world.width, level.world.depth), new THREE.MeshBasicMaterial({ map: this.grassTexture, transparent: true })); grass.rotation.x = -Math.PI / 2; grass.position.y = 0.012; this.scene.add(grass);
    for (const patch of level.tallGrassPatches) this.addTallGrassPatch(patch); for (const object of level.objects) this.addObject(object); this.addMower(); for (const hazard of level.hazards) { const item = this.addHazard(hazard.type); item.position.set(hazard.position.x, 0.16, hazard.position.z); this.markInspectable(item, { name: this.titleCase(hazard.type), model: "Hazard", detail: "Hidden lawn obstacle. Hitting it costs a strike.", kind: "hazard", visual: `hazard-${hazard.type}` }); this.hazards.set(hazard.id, item); }
    for (const item of level.collectibles) { const group = new THREE.Group(); const gem = mesh(new THREE.OctahedronGeometry(0.26), "#ffd35c"); gem.rotation.x = 0.4; gem.castShadow = true; group.add(gem); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 6, 16), material("#fff2b7")); ring.rotation.x = Math.PI / 2; group.add(ring); group.position.set(item.position.x, 0.36, item.position.z); this.markInspectable(group, { name: getPartName(item.unlockId), model: "Upgrade part", detail: "Pick this up to unlock it in the Garage immediately.", kind: "upgrade", visual: `part-${item.unlockId}` }); this.scene.add(group); this.collectibles.set(item.id, group); }
    for (const animal of this.engine.animals) { const group = new THREE.Group(); const body = mesh(new THREE.SphereGeometry(animal.kind === "dog" ? 0.38 : 0.25, 8, 6), animal.kind === "dog" ? "#b47a52" : animal.kind === "cat" ? "#62616b" : "#a9673a"); body.scale.set(1.2, 0.8, 1); body.castShadow = true; group.add(body); const head = mesh(new THREE.SphereGeometry(0.18, 8, 6), animal.kind === "squirrel" ? "#c47e43" : "#efe6d5"); head.position.set(0, 0.1, 0.27); group.add(head); group.position.set(animal.position.x, 0.28, animal.position.z); const inspection = { name: this.titleCase(animal.kind), model: "Animal", detail: "Give it space. Bumping an animal costs a strike.", kind: "animal" as const, visual: `animal-${animal.kind}` }; this.markInspectable(group, inspection); this.attachImportedModel(group, animal.kind, inspection, { height: animal.kind === "dog" ? 0.95 : animal.kind === "cat" ? 0.7 : 0.6 }); this.scene.add(group); this.animals.set(animal.id, group); }
  }
  private addObject(object: GameEngine["level"]["objects"][number]): void {
    const group = new THREE.Group(); const { x, z } = object.position;
    if (object.type === "tree") { const trunk = mesh(new THREE.CylinderGeometry(0.3, 0.42, 2.3, 8), "#8a5e3e"); trunk.position.y = 1.12; trunk.castShadow = true; group.add(trunk); const canopy = mesh(new THREE.DodecahedronGeometry(1.55, 0), "#356d43"); canopy.name = "fade"; canopy.position.y = 3; canopy.scale.set(1, 0.8, 1); canopy.castShadow = true; group.add(canopy); this.occluders.push(group); }
    else if (object.type === "house" || object.type === "cabin") { const w = object.collider.kind === "rect" ? object.collider.width : 3; const d = object.collider.kind === "rect" ? object.collider.depth : 3; const body = mesh(new THREE.BoxGeometry(w, 2.7, d), object.color ?? "#cf765b"); body.name = "fade"; body.position.y = 1.35; body.castShadow = true; body.receiveShadow = true; group.add(body); const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.77, 2.4, 4), "#7b4b48"); roof.name = "fade"; roof.position.y = 3.75; roof.rotation.y = Math.PI / 4; roof.castShadow = true; group.add(roof); group.userData.occlusionRadius = Math.max(w, d) * 0.62; this.occluders.push(group); }
    else if (object.type === "dock") this.addDock(group);
    else { const w = object.collider.kind === "rect" ? object.collider.width : object.collider.radius * 2; const d = object.collider.kind === "rect" ? object.collider.depth : object.collider.radius * 2; const shape = object.type === "water" || object.type === "driveway" || object.type === "patio" || object.type === "garden" ? new THREE.BoxGeometry(w, 0.07, d) : object.type === "rock" || object.type === "firepit" ? new THREE.DodecahedronGeometry(w * 0.55, 0) : new THREE.BoxGeometry(w, 0.8, d); const item = mesh(shape, object.color ?? (object.type === "water" ? "#3c99bb" : object.type === "garden" ? "#a94e62" : "#8f8070")); item.position.y = object.type === "water" || object.type === "driveway" || object.type === "patio" || object.type === "garden" ? 0 : 0.4; item.castShadow = true; group.add(item); }
    const inspection = { name: object.type === "dock" ? "Docking Station" : this.titleCase(object.type), model: object.type === "dock" ? getPartName(this.engine.loadout.dock) : this.titleCase(object.type), detail: object.type === "tree" ? "Bump it and it may drop fruit, a frisbee, a ball, or a critter." : object.type === "dock" ? "Recharge point. Stop mowing is available while parked here." : "Lawn object. Drive around it cleanly.", kind: "object" as const, visual: `object-${object.type}` };
    this.markInspectable(group, inspection);
    if (object.type === "dock") this.attachImportedModel(group, "dock-basic", inspection, { height: 2.1 });
    if (object.type === "house") this.attachImportedModel(group, "ranch-house", inspection, { height: 5.2, occluder: true });
    if (object.type === "cabin") this.attachImportedModel(group, "cabin", inspection, { height: 4.6, occluder: true });
    if (object.type === "tree") this.attachImportedModel(group, "tree", inspection, { height: 4.1, occluder: true });
    group.position.set(x, 0, z); this.scene.add(group);
  }
  private markInspectable(object: THREE.Object3D, info: LawnInspection): void { object.traverse((child) => { child.userData.inspection = info; this.inspectables.push(child); }); }
  private attachImportedModel(group: THREE.Group, key: ImportedAssetKey, info: LawnInspection, options: { height: number; occluder?: boolean }): void {
    const existing = this.modelLoads.get(key);
    const load = existing ?? new Promise<THREE.Group>((resolve, reject) => { this.modelQueue.push({ key, resolve, reject }); this.scheduleModelQueue(); });
    if (!existing) this.modelLoads.set(key, load);
    void load.then((template) => {
      const imported = template.clone(true);
      this.normalizeImportedModel(imported, options.height);
      for (const child of group.children) child.visible = false;
      imported.traverse((child) => {
        child.userData.inspection = info;
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (options.occluder) child.name = "fade";
          this.inspectables.push(child);
        }
      });
      group.add(imported);
    }).catch(() => {
      // Procedural geometry remains visible when an optional imported asset is unavailable.
    });
  }
  private scheduleModelQueue(): void {
    if (this.modelQueueTimer !== undefined) return;
    this.modelQueueTimer = window.setTimeout(() => this.processModelQueue(), 1200);
  }
  private processModelQueue(): void {
    this.modelQueueTimer = undefined;
    const job = this.modelQueue.shift();
    if (!job) return;
    this.modelLoader.loadAsync(importedAssetUrls[job.key]).then((gltf) => job.resolve(gltf.scene), job.reject).finally(() => { if (this.modelQueue.length) this.modelQueueTimer = window.setTimeout(() => this.processModelQueue(), 0); });
  }
  private normalizeImportedModel(model: THREE.Object3D, targetHeight: number): void {
    const initialBounds = new THREE.Box3().setFromObject(model);
    const size = initialBounds.getSize(new THREE.Vector3());
    if (size.y <= 0.001) return;
    model.scale.setScalar(targetHeight / size.y);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= bounds.min.y;
  }
  private titleCase(value: string): string { return value.split("-").map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" "); }
  private addHazard(type: string): THREE.Object3D { const group = new THREE.Group(); const color = type === "fruit" ? "#dd6745" : type === "hose" || type === "leash" ? "#476c87" : type === "goose" ? "#e6e1d5" : "#d9a34c"; const item = type === "hose" || type === "leash" ? new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.07, 6, 14), material(color)) : mesh(new THREE.DodecahedronGeometry(0.3, 0), color); item.rotation.x = Math.PI / 2; item.castShadow = true; group.add(item); const hint = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 16), material("#f4d568")); hint.rotation.x = -Math.PI / 2; hint.position.y = 0.02; group.add(hint); this.scene.add(group); return group; }
  private addDock(group: THREE.Group): void {
    const dockId = this.engine.loadout.dock; const padColor = dockId === "dock_round_plaza" ? "#a88f68" : dockId === "dock_signal_beacon" ? "#365d6c" : dockId === "dock_solar_canopy" ? "#526a72" : "#60727c";
    const padGeometry = dockId === "dock_round_plaza" ? new THREE.CylinderGeometry(1.18, 1.28, 0.28, 24) : new THREE.BoxGeometry(2.2, 0.28, 1.6);
    const pad = mesh(padGeometry, padColor, 0.62, 0.15); pad.position.y = 0.14; pad.castShadow = true; pad.receiveShadow = true; group.add(pad);
    const inset = mesh(dockId === "dock_round_plaza" ? new THREE.CylinderGeometry(0.88, 0.96, 0.045, 24) : new THREE.BoxGeometry(1.65, 0.045, 1.08), dockId === "dock_round_plaza" ? "#f1c968" : "#c9d89b", 0.72, 0.05); inset.position.y = 0.31; group.add(inset);
    const rail = mesh(new THREE.BoxGeometry(1.45, 0.08, 0.08), "#e7c66b", 0.38, 0.7); rail.position.set(0, 0.4, -0.55); group.add(rail);
    const beacon = mesh(new THREE.CylinderGeometry(0.085, 0.11, 0.72, 10), dockId === "dock_signal_beacon" ? "#e9b85f" : "#c4e6e4", 0.35, 0.35); beacon.position.set(0.72, 0.68, 0); beacon.castShadow = true; group.add(beacon);
    const beaconCap = mesh(new THREE.SphereGeometry(0.15, 12, 8), dockId === "dock_signal_beacon" ? "#ff765f" : "#d5f4ee", 0.28, 0.1); beaconCap.position.set(0.72, 1.08, 0); group.add(beaconCap);
    const basket = new THREE.Group(); basket.name = "dock-basket"; const basketBody = mesh(new THREE.BoxGeometry(0.72, 0.42, 0.52), "#d79a4f", 0.7, 0.05); basketBody.position.y = 0.52; basket.add(basketBody); const basketInside = mesh(new THREE.BoxGeometry(0.55, 0.035, 0.38), "#6f4934", 0.8, 0); basketInside.position.y = 0.74; basket.add(basketInside); const basketHandle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 6, 16, Math.PI), material("#f1c968", 0.45, 0.35)); basketHandle.rotation.x = Math.PI / 2; basketHandle.position.set(0, 0.72, 0); basket.add(basketHandle); basket.position.set(-0.58, 0, 0.25); group.add(basket);
    if (dockId === "dock_signal_beacon") {
      for (const side of [-1, 1]) { const post = mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.72, 8), "#dfe9dc", 0.4, 0.2); post.position.set(side * 0.75, 0.68, 0.4); group.add(post); }
      const arch = mesh(new THREE.BoxGeometry(1.65, 0.08, 0.08), "#e6d28b", 0.35, 0.6); arch.position.set(0, 1.02, 0.4); group.add(arch);
    }
    if (dockId === "dock_solar_canopy") {
      for (const side of [-1, 1]) { const post = mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.7, 8), "#d3e2db", 0.35, 0.5); post.position.set(side * 0.78, 1.05, 0.28); post.castShadow = true; group.add(post); }
      const canopy = mesh(new THREE.BoxGeometry(2.05, 0.12, 1.15), "#294a59", 0.3, 0.6); canopy.position.set(0, 1.92, 0.28); canopy.rotation.x = -0.12; canopy.castShadow = true; group.add(canopy);
      for (const x of [-0.58, 0, 0.58]) { const panel = mesh(new THREE.BoxGeometry(0.42, 0.025, 0.8), "#5eb5c0", 0.28, 0.65); panel.position.set(x, 1.995, 0.28); panel.rotation.x = -0.12; group.add(panel); }
    }
  }
  private addTallGrassPatch(patch: TallGrassPatch): void {
    const group = new THREE.Group(); group.name = `tall-grass-${patch.id}`; group.position.set(patch.center.x, 0, patch.center.z); group.userData.patchId = patch.id;
    const base = mesh(new THREE.PlaneGeometry(patch.width, patch.depth), "#315f35", 0.95, 0); base.rotation.x = -Math.PI / 2; base.position.y = 0.018; base.userData.tallGrassBase = true; group.add(base);
    const rows = Math.max(3, Math.ceil(patch.depth / 0.7)); const columns = Math.max(4, Math.ceil(patch.width / 0.7));
    for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) { const x = -patch.width / 2 + (column + 0.5) * patch.width / columns; const z = -patch.depth / 2 + (row + 0.5) * patch.depth / rows; const blade = mesh(new THREE.ConeGeometry(0.075, 0.62 + ((row * 7 + column * 11) % 4) * 0.08, 4), column % 2 ? "#477c3c" : "#5c9144", 0.95, 0); blade.position.set(x, 0.32, z); blade.rotation.y = (row + column) * 0.7; blade.userData.tallGrassBlade = true; blade.castShadow = true; group.add(blade); }
    this.markInspectable(group, { name: patch.name, model: "Tall grass", detail: `Slows the mower until it is crossed ${patch.passesRequired} times. Each pass clears more of the patch.`, kind: "object", visual: "object-tall-grass" }); this.scene.add(group); this.tallGrass.set(patch.id, group);
  }
  private addMower(): void {
    const stats = this.engine.stats; const deck = mesh(new THREE.CylinderGeometry(stats.deckRadius, stats.deckRadius * 0.94, 0.2, 20), "#263541", 0.52, 0.45); deck.scale.z = 0.8; deck.position.y = 0.17; deck.castShadow = true; this.mower.add(deck);
    const deckGuard = new THREE.Mesh(new THREE.TorusGeometry(stats.deckRadius * 0.82, 0.055, 8, 24), material("#d9b65d", 0.38, 0.65)); deckGuard.rotation.x = Math.PI / 2; deckGuard.position.y = 0.28; this.mower.add(deckGuard);
    const bodyId = this.engine.loadout.body; const shellGeometry = bodyId === "body_rounded_shell" ? new THREE.SphereGeometry(0.7, 16, 10) : bodyId === "body_wedge_aero" ? new THREE.CylinderGeometry(0.72, 0.52, 0.5, 6) : bodyId === "body_compact_scout" ? new THREE.BoxGeometry(0.9, 0.45, 0.95) : new THREE.BoxGeometry(bodyId === "body_heavy_utility" ? 1.28 : 1.08, bodyId === "body_heavy_utility" ? 0.62 : 0.52, 1.2);
    const shell = mesh(shellGeometry, stats.color, 0.48, 0.08); shell.position.y = 0.48; if (bodyId === "body_rounded_shell") shell.scale.set(1, 0.55, 0.9); if (bodyId === "body_wedge_aero") shell.rotation.y = Math.PI / 2; shell.castShadow = true; shell.name = "shell"; this.mower.add(shell);
    const batteryId = this.engine.loadout.battery; const batteryLength = batteryId === "battery_long_range" ? 0.7 : batteryId === "battery_fast_charge" ? 0.45 : 0.54; const batteryHeight = batteryId === "battery_long_range" ? 0.28 : batteryId === "battery_fast_charge" ? 0.34 : 0.24; const batteryColor = batteryId === "battery_fast_charge" ? "#f2c75d" : batteryId === "battery_long_range" ? "#6f858a" : "#52646c";
    const battery = mesh(new THREE.BoxGeometry(0.42, batteryHeight, batteryLength), batteryColor, 0.34, 0.55); battery.position.set(-0.32, 0.82, -0.2); battery.castShadow = true; this.mower.add(battery);
    const terminal = mesh(new THREE.BoxGeometry(0.26, 0.035, 0.08), "#e8f0dc", 0.24, 0.75); terminal.position.set(-0.32, 0.82 + batteryHeight / 2 + 0.025, -0.2 + batteryLength * 0.32); this.mower.add(terminal);
    const sensorId = this.engine.loadout.sensor; const bumperColor = sensorId === "sensor_hazard_ping" ? "#e9b85f" : sensorId === "sensor_wide_scan" ? "#66cfd0" : "#d9f4ec"; const bumperWidth = sensorId === "sensor_wide_scan" ? 1.22 : bodyId === "body_compact_scout" ? 0.86 : 1.04;
    const bumper = mesh(new THREE.BoxGeometry(bumperWidth, 0.1, 0.12), bumperColor, 0.28, 0.55); bumper.position.set(0, 0.34, 0.67); bumper.castShadow = true; this.mower.add(bumper);
    if (sensorId === "sensor_wide_scan") {
      const scannerBase = mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.12, 14), "#263541", 0.32, 0.55); scannerBase.position.set(0.28, 0.94, -0.12); scannerBase.castShadow = true; this.mower.add(scannerBase);
      const scanner = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 24), "#6bd1d1", 0.2, 0.45); scanner.position.set(0.28, 1.04, -0.12); scanner.castShadow = true; this.mower.add(scanner);
      const scannerBar = mesh(new THREE.BoxGeometry(0.62, 0.035, 0.05), "#d9fbf6", 0.18, 0.35); scannerBar.position.set(0.28, 1.1, -0.12); this.mower.add(scannerBar);
    }
    if (sensorId === "sensor_hazard_ping") {
      for (const side of [-1, 1]) {
        const lightMaterial = new THREE.MeshStandardMaterial({ color: "#ffb33b", emissive: "#ff6b3a", emissiveIntensity: 1.2, roughness: 0.22, metalness: 0.1, flatShading: true });
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), lightMaterial) as MaterialMesh; light.position.set(side * 0.66, 0.52, 0.1); light.castShadow = true; this.mower.add(light); this.hazardPingLights.push(light);
      }
    }
    const wheel = () => mesh(stats.tracks ? new THREE.BoxGeometry(0.2, 0.34, 1.08) : new THREE.CylinderGeometry(0.22, 0.22, 0.18, 14), "#1e282b", 0.62, 0.15);
    for (const side of [-1, 1]) { const mobility = wheel(); mobility.position.set(side * 0.61, 0.27, 0); if (!stats.tracks) mobility.rotation.z = Math.PI / 2; mobility.castShadow = true; this.mower.add(mobility); const hub = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 10), "#71858a", 0.42, 0.55); hub.position.set(side * 0.72, 0.27, 0); hub.rotation.z = Math.PI / 2; this.mower.add(hub); }
    const glass = mesh(new THREE.BoxGeometry(bodyId === "body_compact_scout" ? 0.48 : 0.6, 0.24, 0.42), "#c6eef4", 0.18, 0.1); glass.position.set(0, 0.76, 0.05); this.mower.add(glass);
    for (const side of [-1, 1]) { const headlamp = mesh(new THREE.SphereGeometry(0.07, 10, 8), "#fff2b0", 0.2, 0.2); headlamp.position.set(side * 0.26, 0.52, 0.62); this.mower.add(headlamp); }
    const antenna = mesh(new THREE.CylinderGeometry(0.028, 0.035, 0.58, 8), "#f4d568", 0.3, 0.4); antenna.position.set(0, 1.02, -0.18); this.mower.add(antenna); const antennaTip = mesh(new THREE.SphereGeometry(0.09, 10, 8), "#ff8264", 0.25, 0.2); antennaTip.position.set(0, 1.34, -0.18); this.mower.add(antennaTip);
    const arms = new THREE.Group(); arms.name = "arms"; const armStyle = this.engine.stats.arms; const armColor = armStyle === "arms_magnet_boom" ? "#f2c75d" : armStyle === "arms_twin_grabber" ? "#4d8fc5" : "#d9554d"; const armAccent = armStyle === "arms_magnet_boom" ? "#d9554d" : "#f2c75d";
    if (armStyle === "arms_magnet_boom") { const boom = mesh(new THREE.BoxGeometry(0.16, 0.16, 0.86), armColor, 0.38, 0.4); boom.position.set(0, 0.62, 0.72); boom.rotation.x = -0.32; arms.add(boom); const magnet = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.13, 12), armAccent, 0.35, 0.5); magnet.rotation.x = Math.PI / 2; magnet.position.set(0, 0.48, 1.1); arms.add(magnet); }
    else { const spread = armStyle === "arms_twin_grabber" ? 0.48 : 0.32; for (const side of [-1, 1]) { const upper = mesh(new THREE.BoxGeometry(0.11, 0.11, 0.54), armColor, 0.4, 0.3); upper.position.set(side * spread * 0.55, 0.59, 0.82); upper.rotation.x = -0.38; arms.add(upper); const claw = mesh(new THREE.BoxGeometry(0.16, 0.08, 0.28), armAccent, 0.38, 0.28); claw.position.set(side * spread, 0.45, 1.08); claw.rotation.y = side * 0.24; arms.add(claw); } }
    this.mower.add(arms);
    const outline = new THREE.Mesh(new THREE.TorusGeometry(stats.deckRadius + 0.14, 0.04, 8, 24), material("#fff5ba", 0.35, 0.45)); outline.rotation.x = Math.PI / 2; outline.position.y = 0.035; this.mower.add(outline); this.markInspectable(this.mower, { name: "MOWBOT", model: getPartName(this.engine.loadout.body), detail: "The active mower build. Garage parts change its shape, battery, deck, sensors, mobility, and Arms for carrying yard items.", kind: "mower", visual: "object-mower" }); this.scene.add(this.mower);
  }
  private addDrop(drop: LawnDrop): THREE.Object3D {
    const group = new THREE.Group(); const color = drop.kind === "fruit" ? "#dd6745" : drop.kind === "frisbee" ? "#66cfd0" : drop.kind === "ball" ? "#f2c75d" : "#b47a52";
    const item = drop.kind === "frisbee" ? mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 18), color, 0.42, 0.1) : drop.kind === "ball" ? mesh(new THREE.SphereGeometry(0.26, 12, 8), color, 0.38, 0.05) : drop.kind === "animal" ? mesh(new THREE.SphereGeometry(0.3, 8, 6), color, 0.72, 0) : mesh(new THREE.DodecahedronGeometry(0.28, 0), color, 0.72, 0);
    item.castShadow = true; group.add(item); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.025, 6, 18), material("#fff2b7", 0.35, 0.25)); ring.rotation.x = Math.PI / 2; group.add(ring); group.position.set(drop.position.x, 0.3, drop.position.z); this.markInspectable(group, { name: drop.name, model: "Tree drop", detail: "Bonus yard item shaken loose by bumping a tree.", kind: "drop", visual: `drop-${drop.kind}` }); this.scene.add(group); return group;
  }
  private paintGrass(): void { const colors: Record<number, [number, number, number, number]> = { [GrassCellState.NonMowable]: [0, 0, 0, 0], [GrassCellState.Uncut]: [75, 151, 70, 255], [GrassCellState.Cut]: [166, 201, 106, 255] }; for (let index = 0; index < this.engine.grass.states.length; index += 1) { const pixel = index * 4; const color = colors[this.engine.grass.states[index]]; this.grassImage.data[pixel] = color[0]; this.grassImage.data[pixel + 1] = color[1]; this.grassImage.data[pixel + 2] = color[2]; this.grassImage.data[pixel + 3] = color[3]; this.grassSnapshot[index] = this.engine.grass.states[index]; } }
  resize = (): void => { const width = this.host.clientWidth || innerWidth; const height = this.host.clientHeight || innerHeight; this.renderer.setSize(width, height, false); const aspect = width / height; const vertical = innerWidth < 900 ? 8.6 : 10; this.camera.left = -vertical * aspect; this.camera.right = vertical * aspect; this.camera.top = vertical; this.camera.bottom = -vertical; this.camera.updateProjectionMatrix(); };
  sync(): void {
    const { mower, grass, level } = this.engine; this.mower.position.set(mower.position.x, 0, mower.position.z); this.mower.rotation.y = mower.angle; const shell = this.mower.getObjectByName("shell") as MaterialMesh | undefined; if (shell) shell.material.color.set(this.engine.stats.color);
    if (this.hazardPingLights.length) { const pulse = 0.5 + Math.sin(this.engine.state.elapsedSeconds * 9) * 0.5; for (const light of this.hazardPingLights) light.material.emissiveIntensity = 0.55 + pulse * 1.9; }
    if (grass.states.some((state, index) => state !== this.grassSnapshot[index])) { this.paintGrass(); this.grassContext.putImageData(this.grassImage, 0, 0); this.grassTexture.needsUpdate = true; }
    for (const hazard of level.hazards) { const visual = this.hazards.get(hazard.id)!; const state = this.engine.hazards.get(hazard.id)!; visual.visible = state.revealed && !state.hit; visual.rotation.y += 0.015; }
    for (const collectible of level.collectibles) { const visual = this.collectibles.get(collectible.id)!; visual.visible = !this.engine.collectibles.has(collectible.id); visual.rotation.y += 0.025; visual.position.y = 0.32 + Math.sin(this.engine.state.elapsedSeconds * 3 + visual.position.x) * 0.08; }
    for (const drop of this.engine.drops) { const visual = this.drops.get(drop.id) ?? this.addDrop(drop); this.drops.set(drop.id, visual); visual.visible = !drop.delivered; visual.rotation.y += 0.03; if (drop.carried) visual.position.set(mower.position.x, 0.88, mower.position.z + 0.8); else visual.position.set(drop.position.x, 0.28 + Math.sin(this.engine.state.elapsedSeconds * 4 + drop.position.x) * 0.05, drop.position.z); }
    for (const patch of level.tallGrassPatches) { const visual = this.tallGrass.get(patch.id); if (!visual) continue; const cleared = (this.engine.tallGrassPasses.get(patch.id) ?? 0) >= patch.passesRequired; visual.traverse((object) => { if (!(object instanceof THREE.Mesh) || !object.userData.tallGrassBlade) return; const bladeMaterial = object.material as THREE.MeshStandardMaterial; bladeMaterial.color.set(cleared ? "#91ae61" : "#477c3c"); object.scale.y += ((cleared ? 0.45 : 1) - object.scale.y) * 0.12; }); }
    for (const animal of this.engine.animals) { const visual = this.animals.get(animal.id)!; visual.position.set(animal.position.x, 0.28, animal.position.z); visual.rotation.y = Math.atan2(this.engine.mower.position.x - animal.position.x, this.engine.mower.position.z - animal.position.z); }
    for (const occluder of this.occluders) { const cameraX = this.camera.position.x; const cameraZ = this.camera.position.z; const lineX = mower.position.x - cameraX; const lineZ = mower.position.z - cameraZ; const lineLengthSquared = lineX * lineX + lineZ * lineZ; const progress = ((occluder.position.x - cameraX) * lineX + (occluder.position.z - cameraZ) * lineZ) / lineLengthSquared; const closestX = cameraX + lineX * clamp(progress, 0, 1); const closestZ = cameraZ + lineZ * clamp(progress, 0, 1); const radius = Number(occluder.userData.occlusionRadius ?? 1.65); const betweenCameraAndMower = progress > 0.08 && progress < 0.94 && (occluder.position.x - closestX) ** 2 + (occluder.position.z - closestZ) ** 2 < radius ** 2; occluder.traverse((object) => { if (object.name === "fade" && object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) { object.material.transparent = true; object.material.opacity += ((betweenCameraAndMower ? 0.3 : 1) - object.material.opacity) * 0.14; } }); }
    const boundX = level.world.width / 2 - 5; const boundZ = level.world.depth / 2 - 5; this.target.set(clamp(mower.position.x, -boundX, boundX), 0, clamp(mower.position.z, -boundZ, boundZ)); const desired = this.target.clone().add(new THREE.Vector3(17, 19, 17)); this.camera.position.lerp(desired, 0.08); this.camera.lookAt(this.target); this.renderer.render(this.scene, this.camera);
  }
  inspectAt(clientX: number, clientY: number): LawnInspection | null {
    const bounds = this.renderer.domElement.getBoundingClientRect(); this.pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1; this.pointer.y = -((clientY - bounds.top) / bounds.height) * 2 + 1; this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.inspectables, false).find((item) => item.object.visible && item.object.userData.inspection);
    return hit?.object.userData.inspection ?? null;
  }
  dispose(): void { window.removeEventListener("resize", this.resize); if (this.modelQueueTimer !== undefined) window.clearTimeout(this.modelQueueTimer); this.renderer.dispose(); this.host.replaceChildren(); }
}
