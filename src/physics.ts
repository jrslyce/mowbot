import RAPIER from "@dimforge/rapier3d-compat";
import type { LevelDefinition } from "./types";

export class RapierPhysics {
  world: RAPIER.World | null = null;
  async initialize(level: LevelDefinition): Promise<void> {
    await RAPIER.init(); this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    const mower = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(level.start.position.x, 0.3, level.start.position.z)); this.world.createCollider(RAPIER.ColliderDesc.ball(0.45), mower);
    for (const object of level.objects) { if (object.type === "dock") continue; const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(object.position.x, 0, object.position.z)); const shape = object.collider.kind === "circle" ? RAPIER.ColliderDesc.cylinder(0.6, object.collider.radius) : RAPIER.ColliderDesc.cuboid(object.collider.width / 2, 0.6, object.collider.depth / 2); this.world.createCollider(shape, body); }
  }
  dispose(): void { this.world?.free(); this.world = null; }
}
