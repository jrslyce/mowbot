import type { NormalizedInput } from "./types";

const neutral = (): NormalizedInput => ({ steer: 0, throttle: 0, brake: 0, reverse: 0, interact: false, pause: false });
export class InputManager {
  private keys = new Set<string>(); private touch = { x: 0, y: 0, brake: 0 }; private pausePulse = false;
  constructor() { this.onDown = this.onDown.bind(this); this.onUp = this.onUp.bind(this); window.addEventListener("keydown", this.onDown); window.addEventListener("keyup", this.onUp); }
  private onDown(event: KeyboardEvent): void { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault(); if (event.key === "Escape") this.pausePulse = true; this.keys.add(event.key.toLowerCase()); }
  private onUp(event: KeyboardEvent): void { this.keys.delete(event.key.toLowerCase()); }
  setTouch(x: number, y: number, brake: number): void { this.touch = { x, y, brake }; }
  read(): NormalizedInput {
    const output = neutral(); output.throttle = Number(this.keys.has("w") || this.keys.has("arrowup")); output.reverse = Number(this.keys.has("s") || this.keys.has("arrowdown")); output.steer = Number(this.keys.has("d") || this.keys.has("arrowright")) - Number(this.keys.has("a") || this.keys.has("arrowleft")); output.brake = Number(this.keys.has(" "));
    const pad = navigator.getGamepads?.().find(Boolean); if (pad) { output.steer = Math.abs(pad.axes[0]) > 0.12 ? pad.axes[0] : output.steer; output.throttle = Math.max(output.throttle, Math.max(0, -pad.axes[1]), pad.buttons[7]?.value ?? 0); output.reverse = Math.max(output.reverse, pad.buttons[6]?.value ?? 0); output.brake = Math.max(output.brake, pad.buttons[0]?.value ?? 0); if (pad.buttons[9]?.pressed) this.pausePulse = true; }
    output.steer = Math.abs(this.touch.x) > 0.08 ? this.touch.x : output.steer; output.throttle = Math.max(output.throttle, Math.max(0, -this.touch.y)); output.reverse = Math.max(output.reverse, Math.max(0, this.touch.y)); output.brake = Math.max(output.brake, this.touch.brake); output.pause = this.pausePulse; this.pausePulse = false; return output;
  }
  dispose(): void { window.removeEventListener("keydown", this.onDown); window.removeEventListener("keyup", this.onUp); }
}
