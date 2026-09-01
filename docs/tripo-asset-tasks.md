# RoboMow Tripo3D asset task queue

The machine-readable queue is in [`tripo-asset-task-manifest.json`](./tripo-asset-task-manifest.json). It contains individual model, animation, integration, and QA tasks for the current MOWBOT game.

## Execution order

1. Run `MODEL-MOWER-001` and approve the hero MOWBOT silhouette.
2. Use that approved model as the reference for the body, mobility, deck, battery, sensor, and arms tasks.
3. Run the basic dock, one tree, one house, one dog, one hazard, and the pickup set as the first playable asset slice.
4. Complete Blender cleanup and export checks before starting the remaining variants.
5. Run the animal animation tasks only after the corresponding model has clean joints or a validated rig.
6. Implement mower, dock, pickup, and tree animations in Three.js. These are intentionally marked `generation: "code"`; they should respond to the engine state rather than be baked into an AI animation clip.
7. Complete `INTEGRATE-001` through `INTEGRATE-004` after the first asset slice is approved.

## MCP task mapping

For each task where `generation` is `tripo` or `tripo-plus-blender`:

- submit the `prompt` through the Tripo MCP;
- provide the specified reference image or prior approved model when the MCP supports it;
- request GLB output with embedded textures;
- retain the Tripo task ID, model version, prompt, source references, and license tier;
- place the downloaded result in a staging area, not directly in the runtime asset folder;
- perform the acceptance checks before marking the task approved.

For `tripo-candidate-plus-blender` animation tasks, treat the result as a candidate. Run a rig check, inspect every clip in Blender, and reject it in favor of keyframed or procedural animation if feet slide, joints collapse, or the clip cannot blend cleanly with the animal state machine.

## Required cleanup gate

Every approved GLB should have:

- applied transforms and a bottom-center origin;
- front direction documented as `+Z`;
- clean normals and no floating or non-manifold decorative fragments;
- named nodes for any part, hinge, light, scanner, blade, or occluder the game must control;
- a documented triangle count and texture size;
- no hidden cameras, lights, background plane, text, or accidental logos;
- a matching gameplay collider kept separately in the engine.

## First slice acceptance

The first replacement pass is successful when the approved mower, dock, tree, house, dog, hazard, and pickup assets work in:

- the Garage preview;
- live mowing and mower rotation;
- docking and charging presentation;
- inspection cards and upgrade gallery;
- animal movement and flee/return behavior;
- occlusion fading behind buildings and trees;
- desktop and 320x568 mobile layouts.

Run `npm run check` after this slice. Keep the current procedural renderer available as a fallback until the asset path and browser checks are stable.

## References

- [Tripo Developers quick start](https://developers.tripo3d.ai/en/docs/quick-start)
- [Tripo multiview-to-model](https://developers.tripo3d.ai/en/docs/generation-multiview-to-model/p)
- [Tripo model conversion](https://developers.tripo3d.ai/en/docs/models-convert)
- [Tripo terms](https://www.tripo3d.ai/terms)
