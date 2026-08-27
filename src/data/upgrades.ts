import type { EquippedLoadout, MowerStats } from "../types";

type Part = { id: string; name: string; [key: string]: string | number | boolean };
export const parts: Record<string, Part[]> = {
  body: [
    { id: "body_basic_box", name: "Basic Box", turn: 1 },
    { id: "body_rounded_shell", name: "Rounded Shell", turn: 1.05 },
    { id: "body_heavy_utility", name: "Heavy Utility", turn: 0.92 },
    { id: "body_wedge_aero", name: "Wedge Aero", turn: 1.08 },
    { id: "body_compact_scout", name: "Compact Scout", turn: 1.12 }
  ],
  color: [
    { id: "color_factory_green", name: "Factory Green", color: "#48a66a" },
    { id: "color_safety_yellow", name: "Safety Yellow", color: "#f6c74e" },
    { id: "color_racing_red", name: "Racing Red", color: "#d9554d" },
    { id: "color_midnight_blue", name: "Midnight Blue", color: "#315577" },
    { id: "color_orchard_orange", name: "Orchard Orange", color: "#e87e3e" },
    { id: "color_chrome_trim", name: "Chrome Trim", color: "#d7e5df" }
  ],
  mobility: [
    { id: "mobility_standard_wheels", name: "Standard Wheels", acceleration: 1, turn: 1, drain: 1, tracks: false },
    { id: "mobility_grippy_tires", name: "Grippy Tires", acceleration: 1.08, turn: 1.08, drain: 1.03, tracks: false },
    { id: "mobility_turf_tracks", name: "Turf Tracks", acceleration: 0.95, turn: 0.9, drain: 1.08, tracks: true }
  ],
  deck: [
    { id: "deck_starter", name: "Starter Deck", width: 1, drain: 1 },
    { id: "deck_wide", name: "Wide Deck", width: 1.25, drain: 1.12 },
    { id: "deck_precision_edge", name: "Precision Edge", width: 0.95, drain: 0.95 }
  ],
  battery: [
    { id: "battery_stock", name: "Stock Battery", capacity: 1, recharge: 1, drain: 1 },
    { id: "battery_long_range", name: "Long Range", capacity: 1.35, recharge: 0.9, drain: 1.04 },
    { id: "battery_fast_charge", name: "Fast Charge", capacity: 1.05, recharge: 1.35, drain: 1 }
  ],
  sensor: [
    { id: "sensor_basic", name: "Basic Bumper", reveal: 1 },
    { id: "sensor_hazard_ping", name: "Hazard Ping", reveal: 1.35 },
    { id: "sensor_wide_scan", name: "Wide Scan", reveal: 1.65 }
  ],
  dock: [
    { id: "dock_basic_pad", name: "Standard Pad" },
    { id: "dock_round_plaza", name: "Round Plaza" },
    { id: "dock_signal_beacon", name: "Signal Beacon" },
    { id: "dock_solar_canopy", name: "Solar Canopy" }
  ]
};

export const starterLoadout: EquippedLoadout = {
  body: "body_basic_box", color: "color_factory_green", mobility: "mobility_standard_wheels", deck: "deck_starter", battery: "battery_stock", sensor: "sensor_basic", dock: "dock_basic_pad"
};

const find = (group: string, id: string) => parts[group].find((part) => part.id === id) ?? parts[group][0];
export const getPartName = (id: string) => Object.values(parts).flat().find((part) => part.id === id)?.name ?? id;
const turnSpeedMultiplier = 3;

export function calculateStats(loadout: EquippedLoadout): MowerStats {
  const body = find("body", loadout.body); const color = find("color", loadout.color); const mobility = find("mobility", loadout.mobility);
  const deck = find("deck", loadout.deck); const battery = find("battery", loadout.battery); const sensor = find("sensor", loadout.sensor);
  return {
    maxSpeed: 4, acceleration: 7 * Number(mobility.acceleration), turnSpeed: 2.6 * turnSpeedMultiplier * Number(body.turn) * Number(mobility.turn),
    deckRadius: 0.62 * Number(deck.width), capacity: 100 * Number(battery.capacity), rechargeRate: 25 * Number(battery.recharge),
    drain: Number(mobility.drain) * Number(deck.drain) * Number(battery.drain), sensorRadius: 1.6 * Number(sensor.reveal),
    color: String(color.color), tracks: Boolean(mobility.tracks)
  };
}

export const allPartIds = Object.values(parts).flat().map((part) => part.id);
