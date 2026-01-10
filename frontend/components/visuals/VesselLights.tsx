"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ---------------------------
 * ICONS & ASSETS
 * ---------------------------
 */

const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

/**
 * ---------------------------
 * LIGHT ID MATCHING UTILITIES
 * ---------------------------
 */

// Sidelight pairs - when one is hovered, both should be highlighted
const SIDELIGHT_PAIRS: string[][] = [
  ["port", "stbd", "side", "port-side", "stbd-side", "sidelight"],
  ["tug-port", "tug-stbd"],
  ["towed-port", "towed-stbd", "side-tow"],
  ["pushed-port", "pushed-stbd", "pushing-port", "pushing-stbd", "side-pushed"],
  ["seaplane-port", "seaplane-stbd", "side-seaplane"],
  ["tricolor-red", "tricolor-green", "tricolor-side"],
];

function getRelatedLightIds(id: string): string[] {
  const normalizedId = id.toLowerCase();
  for (const pair of SIDELIGHT_PAIRS) {
    if (pair.some(p => normalizedId.includes(p))) {
      return pair;
    }
  }
  return [id];
}

function shouldHighlight(lightId: string, lightType: string, highlightedIds: Set<string>): boolean {
  if (highlightedIds.size === 0) return false;
  const normalizedId = lightId.toLowerCase();
  const normalizedType = lightType?.toLowerCase() || "";

  if (highlightedIds.has(normalizedId) || highlightedIds.has(normalizedType)) return true;

  for (const id of highlightedIds) {
    const relatedIds = getRelatedLightIds(id);
    for (const relatedId of relatedIds) {
      if (normalizedId.includes(relatedId) || normalizedType.includes(relatedId)) {
        return true;
      }
    }
  }
  return false;
}

function getArcOriginY(arc: { position?: string; customOrigin?: { x: number; y: number } }): number {
  if (arc.customOrigin) return arc.customOrigin.y;
  const positionYMap: Record<string, number> = {
    'center': 50, 'fore-mast': 38, 'aft-mast': 62, 'stern': 66,
    'port': 50, 'starboard': 50, 'tug-center': 29, 'tug-fore-mast': 22,
    'tug-stern': 37, 'tug-port': 29, 'tug-starboard': 29, 'towed-fore': 55,
    'towed-aft': 83, 'towed-port': 69, 'towed-starboard': 69,
    'pusher-center': 65, 'pusher-fore-mast': 56, 'pusher-stern': 78,
    'pusher-port': 65, 'pusher-starboard': 65, 'pushed-fore': 18,
    'pushed-center': 32, 'pushed-port': 32, 'pushed-starboard': 32,
  };
  return positionYMap[arc.position || 'center'] || 50;
}

/**
 * ---------------------------
 * TYPES & INTERFACES
 * ---------------------------
 */

export type VesselType =
  | "power-driven" | "sailing" | "fishing-trawling" | "fishing-other" | "not-under-command"
  | "restricted-ability-to-maneuver" | "restricted-ability-to-maneuver-underwater-operations"
  | "restricted-ability-to-maneuver-mine-clearance" | "constrained-by-draft" | "vessel-towing"
  | "vessel-pushing" | "anchored" | "aground" | "pilot-on-duty" | "seaplane" | "air-cushon";

export type LengthCategory =
  | "Under 7m" | "Under 12m" | "Under 20m" | "Over 20m" | "Over 20m - Additional"
  | "Under 50m" | "Over 50m" | "Over 100m" | "default" | "Making way" | "Making way (+150m)"
  | "Not making way" | "Not making way (+150m)" | "At anchor" | "Towing" | "Diving operations"
  | "Underway" | "On anchor" | "Tow under 200m" | "Tow over 200m" | "Partly submerged under 200m"
  | "Partly submerged over 200m" | "Single vessel" | "Group of vessels" | "Rigidly connected"
  | "A seaplane" | "A WIG craft";

export type ViewAngle = "port" | "starboard" | "ahead" | "stern" | "top";
export type LightColor = "white" | "red" | "green" | "yellow";

export interface LightConfig {
  id: string; x: number; y: number; color: LightColor; label: string; range?: number | "not-specified"; isAllRound?: boolean;
}

export interface ArcConfig {
  type: string; color: LightColor; arc: number; startAngle: number; range?: number | "not-specified";
  position?: string; customOrigin?: { x: number; y: number }; label: string;
}

export interface VesselLightsProps {
  type?: VesselType;
  length?: LengthCategory;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  showLabels?: boolean;
}

/**
 * ---------------------------
 * MATH HELPERS
 * ---------------------------
 */

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", x, y, "L", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" ");
}

/**
 * ---------------------------
 * CONSTANTS & DATA
 * ---------------------------
 */

export const VESSEL_TYPES: Record<VesselType, string> = {
  "power-driven": "Power-driven vessel",
  "sailing": "Sailing vessel underway & vessel under oars",
  "air-cushon": "Air cushon vessel underway",
  "fishing-other": "Vessel engaged in fishing (other than trawling)",
  "fishing-trawling": "Vessel engaged in trawling",
  "not-under-command": "Vessel not under command",
  "restricted-ability-to-maneuver": "Restricted manueverability",
  "restricted-ability-to-maneuver-underwater-operations": "Restricted manueverability - underwater operations",
  "restricted-ability-to-maneuver-mine-clearance": "Restricted manueverability - mine clearance",
  "constrained-by-draft": "Vessel constrained by her draught",
  "vessel-towing": "Power-driven vessel towing",
  "vessel-pushing": "Power-driven vessel pushing ahead",
  "anchored": "Vessel at anchor",
  "aground": "Vessel aground",
  "pilot-on-duty": "Pilot vessel on duty",
  "seaplane": "Seaplanes"
};

const SIZE_CONFIG = {
  sm: { width: 260, height: 130, topSize: 200 },
  md: { width: 340, height: 170, topSize: 300 },
  lg: { width: 440, height: 220, topSize: 400 },
};

const LIGHT_COLORS: Record<LightColor, { fill: string; glow: string; stroke: string; arcFill: string }> = {
  white: { fill: "#ffffff", glow: "rgba(255, 255, 255, 0.9)", stroke: "rgba(255, 255, 255, 0.9)", arcFill: "rgba(255, 255, 255, 0.15)" },
  red: { fill: "#ef4444", glow: "rgba(239, 68, 68, 0.9)", stroke: "rgba(239, 68, 68, 0.95)", arcFill: "rgba(239, 68, 68, 0.2)" },
  green: { fill: "#22c55e", glow: "rgba(34, 197, 94, 0.9)", stroke: "rgba(34, 197, 94, 0.95)", arcFill: "rgba(34, 197, 94, 0.2)" },
  yellow: { fill: "#eab308", glow: "rgba(234, 179, 8, 0.9)", stroke: "rgba(234, 179, 8, 0.95)", arcFill: "rgba(234, 179, 8, 0.2)" },
};

// Helper to override arc properties (especially range)
const arc = <T extends ArcConfig | ArcConfig[]>(
  base: T,
  overrides: Partial<ArcConfig>
): T => {
  if (Array.isArray(base)) {
    return base.map(a => ({ ...a, ...overrides })) as T;
  }
  return { ...base, ...overrides } as T;
};

// Reusable standard arc sets
const ARCS = {
  sidelights: [
    { type: "side-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "port", label: "Port Sidelight" },
    { type: "side-starboard", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "starboard", label: "Starboard Sidelight" },
  ] as ArcConfig[],
  stern: { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "stern", label: "Sternlight" } as ArcConfig,
  masthead: { type: "mh-fore", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "fore-mast", label: "Masthead" } as ArcConfig,
  mastheadAft: { type: "mh-aft", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "aft-mast", label: "Masthead (Aft)" } as ArcConfig,
  anchor: { type: "anchor", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Anchor Light" } as ArcConfig,
  nuc: [
    { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
    { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
  ] as ArcConfig[],
};

// TODO: Potentially at some point sort all the ranges.
export const VESSEL_LIGHT_CONFIGS: Record<VesselType, Record<string, { lights: LightConfig[]; arcs: ArcConfig[] }>> = {
  "power-driven": {
    // Under 12m: masthead 2nm, sidelights 1nm, stern 2nm
    "Under 12m": {
      lights: [
        { id: "mh-fore", x: 66, y: 22, color: "white", label: "Masthead", range: 2 },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight", range: 1 },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: 2 },
      ],
      arcs: [arc(ARCS.masthead, { range: 2 }), ...arc(ARCS.sidelights, { range: 1 }), arc(ARCS.stern, { range: 2 })],
    },
    // 12-50m: masthead 5nm (3nm if under 20m), sidelights 2nm, stern 2nm
    "Under 50m": {
      lights: [
        { id: "mh-fore", x: 66, y: 22, color: "white", label: "Masthead", range: 5 },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight", range: 2 },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: 2 },
      ],
      arcs: [arc(ARCS.masthead, { range: 5 }), ...arc(ARCS.sidelights, { range: 2 }), arc(ARCS.stern, { range: 2 })],
    },
    // 50m+: masthead 6nm, sidelights 3nm, stern 3nm
    "Over 50m": {
      lights: [
        { id: "mh-fore", x: 20, y: 26, color: "white", label: "Masthead", range: 6 },
        { id: "mh-aft", x: 66, y: 22, color: "white", label: "Masthead", range: 6 },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight", range: 3 },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: 3 },
      ],
      arcs: [arc(ARCS.masthead, { range: 6 }), arc(ARCS.mastheadAft, { range: 6 }), ...arc(ARCS.sidelights, { range: 3 }), arc(ARCS.stern, { range: 3 })],
    },
    default: {
      lights: [
        { id: "mh-fore", x: 66, y: 22, color: "white", label: "Masthead", range: "not-specified" },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight", range: "not-specified" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: "not-specified" },
      ],
      arcs: [ARCS.masthead, ...ARCS.sidelights, ARCS.stern],
    },
  },
  "sailing": {
    "Under 7m": {
      lights: [{ id: "ar-white", x: 65, y: 75, color: "white", label: "Handheld lantern", isAllRound: true }],
      arcs: [{ type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Handheld lantern" }],
    },
    "Under 20m": {
      lights: [
        { id: "tricolor-stern", x: 42, y: 26, color: "white", label: "Tricolor lantern", range: "not-specified" },
        { id: "tricolor-side", x: 42, y: 26, color: "red", label: "Tricolor lantern", range: "not-specified" },
      ],
      arcs: [
          { type: "tricolor-side1", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "center", label: "Tricolor (Port)" },
          { type: "tricolor-side2", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "center", label: "Tricolor (Starboard)" },
          { type: "tricolor-stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "center", label: "Tricolor (Stern)" },
      ],
    },
    "Over 20m": {
      lights: [
        { id: "side", x: 28, y: 68, color: "red", label: "Port Sidelight", range: "not-specified" },
        { id: "stern", x: 68, y: 68, color: "white", label: "Sternlight", range: "not-specified" },
      ],
      arcs: [...ARCS.sidelights, ARCS.stern],
    },
    "Over 20m - Additional": {
      lights: [
        { id: "ar-red", x: 42, y: 20, color: "red", label: "All-round Optional Red (Upper)", range: "not-specified", isAllRound: true },
        { id: "ar-green", x: 42, y: 30, color: "green", label: "All-round Optional Green (Lower)", range: "not-specified", isAllRound: true },
        { id: "side", x: 28, y: 68, color: "red", label: "Port Sidelight", range: "not-specified" },
        { id: "stern", x: 68, y: 68, color: "white", label: "Sternlight", range: "not-specified" },
      ],
      arcs: [
        { type: "ar-red", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Optional Red (Upper)" },
        { type: "ar-green", color: "green", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Optional Green (Lower)" },
        ...ARCS.sidelights, ARCS.stern
      ],
    },
    default: {
      lights: [{ id: "ar-white", x: 65, y: 75, color: "white", label: "Handheld lantern", isAllRound: true }],
      arcs: [{ type: "lantern", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Handheld lantern" }],
    },
  },
  "air-cushon": {
    "When in non-displacement mode": {
      lights: [
        { id: "mh-fore", x: 66, y: 22, color: "white", label: "Masthead", range: "not-specified" },
        { id: "ar-yellow-flashing", x: 20, y: 28, color: "yellow", label: "All-round Yellow (flashing)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight", range: "not-specified" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: "not-specified" },
      ],
      arcs: [ARCS.masthead, ARCS.stern,   
        { type: "ar-yellow-flashing", color: "yellow", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Yellow (flashing)" },
        { type: "side-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "port", label: "Port Sidelight" },
        { type: "side-starboard", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "starboard", label: "Starboard Sidelight" }
      ],
    },
    default: {
      lights: [{ id: "ar-white", x: 65, y: 75, color: "white", label: "Handheld lantern", isAllRound: true }],
      arcs: [{ type: "lantern", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Handheld lantern" }],
    },
  },
  "fishing-other": {
    "Making way": {
      lights: [
        { id: "ar-red", x: 20, y: 28, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 42, color: "white", label: "All-round White (Lower)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      ],
      arcs: [
        { type: "ar-red", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Lower)" },
        ...ARCS.sidelights, ARCS.stern
      ],
    },
    "Making way (Gear +150m)": {
      lights: [
        { id: "ar-red", x: 20, y: 28, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 42, color: "white", label: "All-round White (Lower)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
        { id: "ar-white-gear", x: 50, y: 60, color: "white", label: "All-round white (in direction of gear)", isAllRound: true },
      ],
      arcs: [
        { type: "ar-red", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Lower)" },
        { type: "ar-white-gear", color: "white", arc: 360, startAngle: -112.5, range: "not-specified", customOrigin: { x: 55, y: 55 }, label: "All-round white (in direction of gear)" },
        ...ARCS.sidelights, ARCS.stern
      ],
    },
    "Not making way": {
      lights: [
        { id: "ar-red", x: 20, y: 28, color: "red", label: "All-round red (upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 42, color: "white", label: "All-round white (lower)", isAllRound: true },
      ],
      arcs: [
        { type: "ar-red", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Fishing Red" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Fishing White" },
      ],
    },
    "Not making way (Gear +150m)": {
      lights: [
        { id: "ar-red", x: 20, y: 28, color: "red", label: "All-round red (upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 42, color: "white", label: "All-round white (lower)", isAllRound: true },
        { id: "ar-white-gear", x: 50, y: 60, color: "white", label: "All-round white (in direction of gear)", isAllRound: true },
      ],
      arcs: [
        { type: "ar-red", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Fishing Red" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Fishing White" },
        { type: "ar-white-gear", color: "white", arc: 360, startAngle: -112.5, range: "not-specified", customOrigin: { x: 55, y: 55 }, label: "All-round white (in direction of gear)" },
      ],
    },
    default: {
      lights: [
        { id: "ar-red", x: 20, y: 28, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 42, color: "white", label: "All-round White (Lower)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      ],
      arcs: [
        { type: "ar-red", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Lower)" },
        ...ARCS.sidelights, ARCS.stern
      ],
    },
  },
  "fishing-trawling": {
    "Making way": {
      lights: [
        { id: "ar-green", x: 20, y: 28, color: "green", label: "All-round Green (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 42, color: "white", label: "All-round White (Lower)", isAllRound: true },
        { id: "mh-fore", x: 66, y: 22, color: "white", label: "Masthead" },
        { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      ],
      arcs: [
        { type: "ar-green", color: "green", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Green (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Lower)" },
        ARCS.masthead, ...ARCS.sidelights, ARCS.stern
      ],
    },
    "Not making way": {
        lights: [
        { id: "ar-green", x: 20, y: 28, color: "green", label: "All-round Green (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 42, color: "white", label: "All-round White (Lower)", isAllRound: true },
        { id: "mh-fore", x: 66, y: 22, color: "white", label: "Masthead" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      ],
      arcs: [
        { type: "ar-green", color: "green", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Green (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Lower)" },
        ARCS.masthead, ARCS.stern
      ],
    },
    default: {
      lights: [
        { id: "ar-green", x: 20, y: 28, color: "green", label: "All-round Green (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 42, color: "white", label: "All-round White (Lower)", isAllRound: true },
        { id: "mh-fore", x: 66, y: 22, color: "white", label: "Masthead" },
        { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      ],
      arcs: [
        { type: "ar-green", color: "green", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Green (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Lower)" },
        ARCS.masthead, ...ARCS.sidelights, ARCS.stern
      ],
    },
  },
  "not-under-command": {
    "Making way": {
      lights: [
        { id: "ar-red1", x: 20, y: 28, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 42, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      ],
      arcs: [...ARCS.nuc, ...ARCS.sidelights, ARCS.stern],
    },
    "Not making way": {
      lights: [
        { id: "ar-red1", x: 20, y: 28, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 42, color: "red", label: "All-round Red (Lower)", isAllRound: true },
      ],
      arcs: ARCS.nuc,
    },
    default: {
      lights: [
        { id: "ar-red1", x: 20, y: 28, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 42, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      ],
      arcs: [...ARCS.nuc, ...ARCS.sidelights, ARCS.stern],
    },
  },
  "restricted-ability-to-maneuver": {
    "Making way": {
      lights: [
        { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 45, color: "white", label: "All-round White (Middle)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 55, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
        { id: "mh-fore", x: 20, y: 25, color: "white", label: "Masthead (fore)" },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Middle)" },
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
        ARCS.masthead, ...ARCS.sidelights, ARCS.stern
      ],
    },
    "Not making way": {
      lights: [
        { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 45, color: "white", label: "All-round White (Middle)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 55, color: "red", label: "All-round Red (Lower)", isAllRound: true },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Middle)" },
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
      ],
    },
    "At anchor": {
      lights: [
        { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 45, color: "white", label: "All-round White (Middle)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 55, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "anchor-fore", x: 20, y: 26, color: "white", label: "Anchor (fore)", isAllRound: true },
        { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true },
        { id: "anchor-deck", x: 48, y: 60, color: "white", label: "Anchor (deck lights)"},
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Middle)" },
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
        { type: "anchor-fore", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "fore-mast", label: "Anchor (Fore)" },
        { type: "anchor-aft", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "stern", label: "Anchor (Aft)" },
        { type: "anchor-deck", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Anchor (deck lights, ≈ range)" },
      ],
    },
    "Towing": {
      lights: [
        { id: "mh-white-1", x: 20, y: 5, color: "white", label: "Masthead (Upper)"},
        { id: "mh-white-2", x: 20, y: 15, color: "white", label: "Masthead (Middle)"},
        { id: "mh-white-3", x: 20, y: 25, color: "white", label: "Masthead (Lower)"},
        { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 45, color: "white", label: "All-round White (Middle)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 55, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 74, color: "white", label: "Sternlight" },
        { id: "towing", x: 94, y: 64, color: "yellow", label: "Towing Light" },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Middle)" },
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
        { type: "mh-white-1", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "fore-mast", label: "Masthead (Upper)" },
        { type: "mh-white-2", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "fore-mast", label: "Masthead (Middle)" },
        { type: "mh-white-3", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "fore-mast", label: "Masthead (Lower)" },
        ...ARCS.sidelights, ARCS.stern,
        { type: "towing", color: "yellow", arc: 135, startAngle: 112.5, range: "not-specified", position: "stern", label: "Towing Light" },
      ]
    },
    "Diving operations": {
      lights: [
        { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 45, color: "white", label: "All-round White (Middle)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 55, color: "red", label: "All-round Red (Lower)", isAllRound: true },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Middle)" },
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
      ]
    },
    default: {
      lights: [
        { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 45, color: "white", label: "All-round White (Middle)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 55, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
        { id: "mh-fore", x: 20, y: 25, color: "white", label: "Masthead (fore)" },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Middle)" },
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
        ARCS.masthead, ...ARCS.sidelights, ARCS.stern
      ],
    },
  },
  "restricted-ability-to-maneuver-underwater-operations": {
    "Making way": {
      lights: [
        { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 45, color: "white", label: "All-round White (Middle)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 55, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "obstruction", x: 55, y: 64, color: "red", label: "All-round red (in direction of obstruction)", isAllRound: true },
        { id: "obstruction", x: 55, y: 74, color: "red", label: "All-round red (in direction of obstruction)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
        { id: "mh-fore", x: 20, y: 25, color: "white", label: "Masthead (fore)" },
        { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)" },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Middle)" },
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
        { type: "obstruction", color: "red", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 45, y: 55 }, label: "All-round red (in direction of obstruction)" },
        { type: "obstruction", color: "red", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 45, y: 55 }, label: "All-round red (in direction of obstruction)" },
        { type: "free-way", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 55, y: 55 }, label: "All-round green (in direction of free passage)" },
        { type: "free-way", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 55, y: 55 }, label: "All-round green (in direction of free passage)" },

        ARCS.masthead, ...ARCS.sidelights, ARCS.stern, ARCS.mastheadAft
      ],
    },
    "Not making way": {
      lights: [
        { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 45, color: "white", label: "All-round White (Middle)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 55, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "obstruction", x: 55, y: 64, color: "red", label: "All-round red (in direction of obstruction)", isAllRound: true },
        { id: "obstruction", x: 55, y: 74, color: "red", label: "All-round red (in direction of obstruction)", isAllRound: true },
        { id: "mh-fore", x: 20, y: 25, color: "white", label: "Masthead (fore)" },
        { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)" },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Middle)" },
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
        { type: "obstruction", color: "red", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 45, y: 55 }, label: "All-round red (in direction of obstruction)" },
        { type: "obstruction", color: "red", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 45, y: 55 }, label: "All-round red (in direction of obstruction)" },
        { type: "free-way", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 55, y: 55 }, label: "All-round green (in direction of free passage)" },
        { type: "free-way", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 55, y: 55 }, label: "All-round green (in direction of free passage)" },
        ARCS.masthead, ARCS.mastheadAft
      ],
    },
    "At anchor": {
      lights: [
        { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 45, color: "white", label: "All-round White (Middle)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 55, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "obstruction", x: 55, y: 64, color: "red", label: "All-round red (in direction of obstruction)", isAllRound: true },
        { id: "obstruction", x: 55, y: 74, color: "red", label: "All-round red (in direction of obstruction)", isAllRound: true },
        { id: "anchor-fore", x: 20, y: 26, color: "white", label: "Anchor (fore)", isAllRound: true },
        { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Middle)" },
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
        { type: "anchor-fore", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "fore-mast", label: "Anchor (Fore)" },
        { type: "anchor-aft", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "stern", label: "Anchor (Aft)" },
        { type: "obstruction", color: "red", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 45, y: 55 }, label: "All-round red (in direction of obstruction)" },
        { type: "obstruction", color: "red", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 45, y: 55 }, label: "All-round red (in direction of obstruction)" },
        { type: "free-way", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 55, y: 55 }, label: "All-round green (in direction of free passage)" },
        { type: "free-way", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 55, y: 55 }, label: "All-round green (in direction of free passage)" },
      ],
    },
    default: {
      lights: [
        { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-white", x: 20, y: 45, color: "white", label: "All-round White (Middle)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 55, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "obstruction", x: 55, y: 64, color: "red", label: "All-round red (in direction of obstruction)", isAllRound: true },
        { id: "obstruction", x: 55, y: 74, color: "red", label: "All-round red (in direction of obstruction)", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
        { id: "mh-fore", x: 20, y: 25, color: "white", label: "Masthead (fore)" },
        { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)" },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Upper)" },
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round White (Middle)" },
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red (Lower)" },
        { type: "obstruction", color: "red", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 45, y: 55 }, label: "All-round red (in direction of obstruction)" },
        { type: "obstruction", color: "red", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 45, y: 55 }, label: "All-round red (in direction of obstruction)" },
        { type: "free-way", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 55, y: 55 }, label: "All-round green (in direction of free passage)" },
        { type: "free-way", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 55, y: 55 }, label: "All-round green (in direction of free passage)" },
        ARCS.masthead, ...ARCS.sidelights, ARCS.stern, ARCS.mastheadAft
      ],
    },
  },
  "restricted-ability-to-maneuver-mine-clearance": {
    "Underway": {
      lights: [
        { id: "ar-green-unique", x: 20, y: 35, color: "green", label: "All-round Green", isAllRound: true },
        { id: "ar-green-unique1", x: 20, y: 45, color: "green", label: "All-round Green", isAllRound: true },
        { id: "ar-green-unique2", x: 20, y: 45, color: "green", label: "All-round Green", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
        { id: "mh-fore", x: 20, y: 25, color: "white", label: "Masthead (fore)" },
        { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)" },
      ],
      arcs: [
        { type: "ar-green-unique", color: "green", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Green" },
        { type: "ar-green-unique1", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 47, y: 50 }, label: "All-round Green" },
        { type: "ar-green-unique2", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 53, y: 50 }, label: "All-round Green" },
        ARCS.masthead, ...ARCS.sidelights, ARCS.stern, ARCS.mastheadAft
      ],
    },
    "At anchor": {
      lights: [
        { id: "ar-green-unique", x: 20, y: 35, color: "green", label: "All-round Green", isAllRound: true },
        { id: "ar-green-unique1", x: 20, y: 45, color: "green", label: "All-round Green", isAllRound: true },
        { id: "ar-green-unique2", x: 20, y: 45, color: "green", label: "All-round Green", isAllRound: true },
        { id: "anchor-fore", x: 20, y: 20, color: "white", label: "Anchor (fore)", isAllRound: true },
        { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true },
      ],
      arcs: [
        { type: "anchor-fore", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "fore-mast", label: "Anchor (Fore)" },
        { type: "ar-green-unique", color: "green", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Green" },
        { type: "ar-green-unique1", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 47, y: 50 }, label: "All-round Green" },
        { type: "ar-green-unique2", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 53, y: 50 }, label: "All-round Green" },
        { type: "anchor-aft", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "stern", label: "Anchor (Aft)" },
      ],
    },
    default: {
      lights: [
        { id: "ar-green-unique", x: 20, y: 35, color: "green", label: "All-round Green", isAllRound: true },
        { id: "ar-green-unique1", x: 20, y: 45, color: "green", label: "All-round Green", isAllRound: true },
        { id: "ar-green-unique2", x: 20, y: 45, color: "green", label: "All-round Green", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port Sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
        { id: "mh-fore", x: 20, y: 25, color: "white", label: "Masthead (fore)" },
        { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)" },
      ],
      arcs: [
        { type: "ar-green-unique", color: "green", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Green" },
        { type: "ar-green-unique1", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 47, y: 50 }, label: "All-round Green" },
        { type: "ar-green-unique2", color: "green", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 53, y: 50 }, label: "All-round Green" },
        ARCS.masthead, ...ARCS.sidelights, ARCS.stern, ARCS.mastheadAft
      ],
    },
  },
  "constrained-by-draft": {
    // 12-50m: masthead 5nm, sidelights 2nm, stern 2nm, all-round 2nm
    "Under 50m": {
       lights: [
           { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red", isAllRound: true, range: 2 },
           { id: "ar-red2", x: 20, y: 45, color: "red", label: "All-round Red", isAllRound: true, range: 2 },
           { id: "ar-red3", x: 20, y: 55, color: "red", label: "All-round Red", isAllRound: true, range: 2 },
           { id: "mh", x: 20, y: 25, color: "white", label: "Masthead", range: 5 },
           { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight", range: 2 },
           { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: 2 },
       ],
       arcs: [
           { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: 2, position: "center", label: "All-round Red 1"},
           { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: 2, position: "center", label: "All-round Red 2"},
           { type: "ar-red3", color: "red", arc: 360, startAngle: 0, range: 2, position: "center", label: "All-round Red 3"},
           arc(ARCS.masthead, { range: 5 }), ...arc(ARCS.sidelights, { range: 2 }), arc(ARCS.stern, { range: 2 })
       ]
    },
    // 50m+: masthead 6nm, sidelights 3nm, stern 3nm, all-round 3nm
    "Over 50m": {
       lights: [
           { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red", isAllRound: true, range: 3 },
           { id: "ar-red2", x: 20, y: 45, color: "red", label: "All-round Red", isAllRound: true, range: 3 },
           { id: "ar-red3", x: 20, y: 55, color: "red", label: "All-round Red", isAllRound: true, range: 3 },
           { id: "mh-fore", x: 20, y: 25, color: "white", label: "Masthead (fore)", range: 6 },
           { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)", range: 6 },
           { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight", range: 3 },
           { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: 3 },
       ],
       arcs: [
           { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: 3, position: "center", label: "All-round Red 1"},
           { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: 3, position: "center", label: "All-round Red 2"},
           { type: "ar-red3", color: "red", arc: 360, startAngle: 0, range: 3, position: "center", label: "All-round Red 3"},
           arc(ARCS.masthead, { range: 6 }), ...arc(ARCS.sidelights, { range: 3 }), arc(ARCS.stern, { range: 3 }), arc(ARCS.mastheadAft, { range: 6 })
       ]
    },
    default: {
       lights: [
           { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round Red", isAllRound: true},
           { id: "ar-red2", x: 20, y: 45, color: "red", label: "All-round Red", isAllRound: true},
           { id: "ar-red3", x: 20, y: 55, color: "red", label: "All-round Red", isAllRound: true},
           { id: "mh", x: 20, y: 25, color: "white", label: "Masthead"},
           { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
           { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
       ],
       arcs: [
           { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red 1"},
           { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red 2"},
           { type: "ar-red3", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Red 3"},
           ARCS.masthead, ...ARCS.sidelights, ARCS.stern
       ]
    },
  },
  "anchored": {
    // Under 50m: all-round white 2nm
    "Under 50m": {
      lights: [{ id: "anchor", x: 20, y: 26, color: "white", label: "Anchor light", isAllRound: true, range: 2 }],
      arcs: [arc(ARCS.anchor, { range: 2 })],
    },
    // 50m+: all-round white 3nm
    "Over 50m": {
      lights: [
        { id: "anchor-fore", x: 20, y: 26, color: "white", label: "Anchor (fore)", isAllRound: true, range: 3 },
        { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true, range: 3 },
      ],
      arcs: [
        { type: "anchor-fore", color: "white", arc: 360, startAngle: 0, range: 3, position: "fore-mast", label: "Anchor (Fore)" },
        { type: "anchor-aft", color: "white", arc: 360, startAngle: 0, range: 3, position: "stern", label: "Anchor (Aft)" },
      ],
    },
    // 100m+: all-round white 3nm
    "Over 100m": {
      lights: [
        { id: "anchor-fore", x: 20, y: 26, color: "white", label: "Anchor (fore)", isAllRound: true, range: 3 },
        { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true, range: 3 },
        { id: "anchor-deck", x: 48, y: 60, color: "white", label: "Anchor (deck lights)", isAllRound: true },
      ],
      arcs: [
        { type: "anchor-fore", color: "white", arc: 360, startAngle: 0, range: 3, position: "fore-mast", label: "Anchor (Fore)" },
        { type: "anchor-aft", color: "white", arc: 360, startAngle: 0, range: 3, position: "stern", label: "Anchor (Aft)" },
        { type: "anchor-deck", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Anchor (Deck lights, ≈ range)" },
      ],
    },
    default: {
      lights: [{ id: "anchor", x: 20, y: 26, color: "white", label: "Anchor light", isAllRound: true }],
      arcs: [ARCS.anchor],
    },
  },
  "aground": {
    // Under 50m: all-round 2nm, anchor 2nm
    "Under 50m": {
      lights: [
        { id: "ar-red1", x: 20, y: 48, color: "red", label: "All-round Red (Upper)", isAllRound: true, range: 2 },
        { id: "ar-red2", x: 20, y: 36, color: "red", label: "All-round Red (Lower)", isAllRound: true, range: 2 },
        { id: "anchor", x: 20, y: 26, color: "white", label: "Anchor light", isAllRound: true, range: 2 }
      ],
      arcs: [
        arc(ARCS.anchor, { range: 2 }),
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: 2, position: "center", label: "Aground Red 1"},
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: 2, position: "center", label: "Aground Red 2"}
      ],
    },
    // 50m+: all-round 3nm, anchor 3nm
    "Over 50m": {
      lights: [
        { id: "ar-red1", x: 20, y: 48, color: "red", label: "All-round Red (Upper)", isAllRound: true, range: 3 },
        { id: "ar-red2", x: 20, y: 36, color: "red", label: "All-round Red (Lower)", isAllRound: true, range: 3 },
        { id: "anchor-fore", x: 20, y: 26, color: "white", label: "Anchor (fore)", isAllRound: true, range: 3 },
        { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true, range: 3 },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: 3, position: "center", label: "Aground Red 1"},
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: 3, position: "center", label: "Aground Red 2"},
        { type: "anchor-fore", color: "white", arc: 360, startAngle: 0, range: 3, position: "fore-mast", label: "Anchor (Fore)" },
        { type: "anchor-aft", color: "white", arc: 360, startAngle: 0, range: 3, position: "stern", label: "Anchor (Aft)" },
      ],
    },
    // 100m+: all-round 3nm, anchor 3nm
    "Over 100m": {
      lights: [
        { id: "ar-red1", x: 20, y: 48, color: "red", label: "All-round Red (Upper)", isAllRound: true, range: 3 },
        { id: "ar-red2", x: 20, y: 36, color: "red", label: "All-round Red (Lower)", isAllRound: true, range: 3 },
        { id: "anchor-fore", x: 20, y: 26, color: "white", label: "Anchor (fore)", isAllRound: true, range: 3 },
        { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true, range: 3 },
        { id: "anchor-deck", x: 48, y: 60, color: "white", label: "Anchor (deck lights)", isAllRound: true },
      ],
      arcs: [
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: 3, position: "center", label: "Aground Red 1"},
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: 3, position: "center", label: "Aground Red 2"},
        { type: "anchor-fore", color: "white", arc: 360, startAngle: 0, range: 3, position: "fore-mast", label: "Anchor (Fore)" },
        { type: "anchor-aft", color: "white", arc: 360, startAngle: 0, range: 3, position: "stern", label: "Anchor (Aft)" },
        { type: "anchor-deck", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Anchor (Deck lights, ≈ range)" },
      ],
    },
    default: {
      lights: [
        { id: "ar-red1", x: 20, y: 48, color: "red", label: "All-round Red (Upper)", isAllRound: true },
        { id: "ar-red2", x: 20, y: 36, color: "red", label: "All-round Red (Lower)", isAllRound: true },
        { id: "anchor", x: 20, y: 26, color: "white", label: "Anchor light", isAllRound: true }
      ],
      arcs: [
        ARCS.anchor,
        { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Aground Red 1"},
        { type: "ar-red2", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Aground Red 2"}
      ],
    },
  },
  "pilot-on-duty": {
    "Underway": {
      lights: [
        { id: "ar-white", x: 20, y: 28, color: "white", label: "Pilot White", isAllRound: true },
        { id: "ar-red", x: 20, y: 42, color: "red", label: "Pilot Red", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      ],
      arcs: [
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Pilot White" },
        { type: "ar-red", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Pilot Red" },
        ...ARCS.sidelights, ARCS.stern
      ],
    },
    "On anchor": {
      lights: [
        { id: "ar-white", x: 20, y: 28, color: "white", label: "Pilot White", isAllRound: true },
        { id: "ar-red", x: 20, y: 42, color: "red", label: "Pilot Red", isAllRound: true },
        { id: "anchor", x: 55, y: 50, color: "white", label: "Anchor light", isAllRound: true }
      ],
      arcs: [
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Pilot White" },
        { type: "ar-red", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Pilot Red" },
        ARCS.anchor,
      ],
    },
    default: {
      lights: [
        { id: "ar-white", x: 20, y: 28, color: "white", label: "Pilot White", isAllRound: true },
        { id: "ar-red", x: 20, y: 42, color: "red", label: "Pilot Red", isAllRound: true },
        { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
        { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      ],
      arcs: [
        { type: "ar-white", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Pilot White" },
        { type: "ar-red", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "Pilot Red" },
        ...ARCS.sidelights, ARCS.stern
      ],
    },
  },
  "vessel-towing": {
      "Tow under 200m": {
        lights: [
            { id: "mh1", x: 23, y: 35, color: "white", label: "Masthead (upper)" },
            { id: "mh2", x: 23, y: 45, color: "white", label: "Masthead (lower)" },
            { id: "side-tow", x: 85, y: 70, color: "red", label: "Port sidelight of towed" },
            { id: "side", x: 18, y: 72, color: "red", label: "Port sidelight" },
            { id: "towing", x: 6, y: 62, color: "yellow", label: "Towing light" },
            { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight" },
            { id: "stern-tow", x: 94, y: 80, color: "white", label: "Sternlight of towed vessel" },
        ],
        arcs: [
            { type: "mh1", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (upper)" },
            { type: "mh2", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (lower)" },
            { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "tug-stern", label: "Sternlight" },
            { type: "tug-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "tug-port", label: "Port Sidelight" },
            { type: "tug-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "tug-starboard", label: "Starboard Sidelight" },
            { type: "towing", color: "yellow", arc: 135, startAngle: 112.5, range: "not-specified", position: "tug-stern", label: "Towing Light" },
            { type: "towed-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "towed-port", label: "Towed Vessel Port Sidelight" },
            { type: "towed-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "towed-starboard", label: "Towed Vessel Starboard Sidelight" },
            { type: "towed-stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "towed-aft", label: "Towed Vessel Sternlight" },
          ]
      },
      "Tow over 200m": {
        lights: [
            { id: "mh1", x: 23, y: 25, color: "white", label: "Masthead (upper)" },
            { id: "mh2", x: 23, y: 35, color: "white", label: "Masthead (middle)" },
            { id: "mh3", x: 23, y: 45, color: "white", label: "Masthead (lower)" },
            { id: "side-tow", x: 85, y: 70, color: "red", label: "Port sidelight of towed" },
            { id: "side", x: 18, y: 72, color: "red", label: "Port sidelight" },
            { id: "towing", x: 6, y: 62, color: "yellow", label: "Towing light" },
            { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight" },
            { id: "stern-tow", x: 94, y: 80, color: "white", label: "Sternlight of towed vessel" },
        ],
        arcs: [
            { type: "mh1", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (upper)" },
            { type: "mh2", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (middle)" },
            { type: "mh3", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (lower)" },
            { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "tug-stern", label: "Sternlight" },
            { type: "tug-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "tug-port", label: "Port Sidelight" },
            { type: "tug-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "tug-starboard", label: "Starboard Sidelight" },
            { type: "towing", color: "yellow", arc: 135, startAngle: 112.5, range: "not-specified", position: "tug-stern", label: "Towing Light" },
            { type: "towed-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "towed-port", label: "Towed Vessel Port Sidelight" },
            { type: "towed-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "towed-starboard", label: "Towed Vessel Starboard Sidelight" },
            { type: "towed-stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "towed-aft", label: "Towed Vessel Sternlight" },
          ]
      },
      "Partly submerged under 200m": {
        lights: [
            { id: "mh1", x: 23, y: 35, color: "white", label: "Masthead (upper)" },
            { id: "mh2", x: 23, y: 45, color: "white", label: "Masthead (lower)" },
            { id: "submerged-fore", x: 63, y: 67, color: "white", label: "Submerged vessel (fore)", isAllRound: true },  
            { id: "submerged-aft", x: 96, y: 67, color: "white", label: "Submerged vessel (aft)", isAllRound: true }, 
            { id: "side", x: 18, y: 72, color: "red", label: "Port sidelight" },
            { id: "towing", x: 6, y: 62, color: "yellow", label: "Towing light" },
            { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight" },
        ],
        arcs: [
            { type: "mh1", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (upper)" },
            { type: "mh2", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (lower)" },
            { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "tug-stern", label: "Sternlight" },
            { type: "tug-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "tug-port", label: "Port Sidelight" },
            { type: "tug-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "tug-starboard", label: "Starboard Sidelight" },
            { type: "towing", color: "yellow", arc: 135, startAngle: 112.5, range: "not-specified", position: "tug-stern", label: "Towing Light" },
            { type: "submerged-fore", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "towed-fore", label: "Submerged Vessel (Fore)" },
            { type: "submerged-aft", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "towed-aft", label: "Submerged Vessel (Aft)" },
        ]
      },
      "Partly submerged over 200m": {
        lights: [
            { id: "mh1", x: 23, y: 25, color: "white", label: "Masthead (upper)" },
            { id: "mh2", x: 23, y: 35, color: "white", label: "Masthead (middle)" },
            { id: "mh3", x: 23, y: 45, color: "white", label: "Masthead (lower)" },
            { id: "middle-tow", x: 78, y: 67, color: "white", label: "Middle White Light (Towed)", isAllRound: true },
            { id: "submerged-fore", x: 63, y: 67, color: "white", label: "Submerged vessel (fore)", isAllRound: true },  
            { id: "submerged-aft", x: 96, y: 67, color: "white", label: "Submerged vessel (aft)", isAllRound: true }, 
            { id: "side", x: 18, y: 72, color: "red", label: "Port sidelight" },
            { id: "towing", x: 6, y: 62, color: "yellow", label: "Towing light" },
            { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight" },
        ],
        arcs: [
            { type: "mh1", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (upper)" },
            { type: "mh2", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (middle)" },
            { type: "mh3", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (lower)" },
            { type: "middle-tow1", color: "white", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 45, y: 65 }, label: "Middle White Light (Towed)" },
            { type: "middle-tow2", color: "white", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 50, y: 65 }, label: "Middle White Light (Towed)" },
            { type: "middle-tow3", color: "white", arc: 360, startAngle: 0, range: "not-specified", customOrigin: { x: 55, y: 65 }, label: "Middle White Light (Towed)" },
            { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "tug-stern", label: "Sternlight" },
            { type: "tug-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "tug-port", label: "Port Sidelight" },
            { type: "tug-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "tug-starboard", label: "Starboard Sidelight" },
            { type: "towing", color: "yellow", arc: 135, startAngle: 112.5, range: "not-specified", position: "tug-stern", label: "Towing Light" },
            { type: "submerged-fore", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "towed-fore", label: "Submerged Vessel (Fore)" },
            { type: "submerged-aft", color: "white", arc: 360, startAngle: 0, range: "not-specified", position: "towed-aft", label: "Submerged Vessel (Aft)" },
        ]
      },
      default: {
        lights: [
            { id: "mh1", x: 23, y: 35, color: "white", label: "Masthead (upper)" },
            { id: "mh2", x: 23, y: 45, color: "white", label: "Masthead (lower)" },
            { id: "side-tow", x: 85, y: 70, color: "red", label: "Port sidelight of towed" },
            { id: "side", x: 18, y: 72, color: "red", label: "Port sidelight" },
            { id: "towing", x: 6, y: 62, color: "yellow", label: "Towing light" },
            { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight" },
            { id: "stern-tow", x: 94, y: 80, color: "white", label: "Sternlight of towed vessel" },
        ],
        arcs: [
            { type: "mh1", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (upper)" },
            { type: "mh2", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "tug-fore-mast", label: "Masthead (lower)" },
            { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "tug-stern", label: "Sternlight" },
            { type: "tug-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "tug-port", label: "Port Sidelight" },
            { type: "tug-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "tug-starboard", label: "Starboard Sidelight" },
            { type: "towing", color: "yellow", arc: 135, startAngle: 112.5, range: "not-specified", position: "tug-stern", label: "Towing Light" },
            { type: "towed-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "towed-port", label: "Towed Vessel Port Sidelight" },
            { type: "towed-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "towed-starboard", label: "Towed Vessel Starboard Sidelight" },
            { type: "towed-stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "towed-aft", label: "Towed Vessel Sternlight" },
          ]
      },
  },
  "vessel-pushing": {
      "Single vessel": {
          lights: [
            { id: "mh1", x: 77, y: 35, color: "white", label: "Masthead (upper)" },
            { id: "mh2", x: 77, y: 45, color: "white", label: "Masthead (lower)" },
            { id: "side", x: 70, y: 70, color: "red", label: "Port sidelight" },
            { id: "side-pushed-obj", x: 3, y: 80, color: "red", label: "Port sidelight of pushed vessel" },
            { id: "stern", x: 95, y: 70, color: "white", label: "Sternlight" },
          ],
          arcs: [
            { type: "mh1", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", customOrigin: { x: 50, y: 65 }, label: "Masthead (upper)" },
            { type: "mh2", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", customOrigin: { x: 50, y: 65 }, label: "Masthead (lower)" },
            { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", customOrigin: { x: 50, y: 75 }, label: "Sternlight" },
            { type: "pushing-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", customOrigin: { x: 40, y: 60 }, label: "Port Sidelight" },
            { type: "pushing-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", customOrigin: { x: 60, y: 60 }, label: "Starboard Sidelight" },
            { type: "pushed-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "pushed-port", label: "Pushed Vessel Port Sidelight" },
            { type: "pushed-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "pushed-starboard", label: "Pushed Vessel Starboard Sidelight" },
          ]
      },
      "Group of vessels": {
          lights: [
            { id: "mh1", x: 77, y: 35, color: "white", label: "Masthead (upper)" },
            { id: "mh2", x: 77, y: 45, color: "white", label: "Masthead (lower)" },
            { id: "side", x: 70, y: 70, color: "red", label: "Port sidelight" },
            { id: "side-pushed-obj", x: 3, y: 80, color: "red", label: "Port sidelight of pushed vessels" },
            { id: "stern", x: 95, y: 70, color: "white", label: "Sternlight" },
          ],
          arcs: [
            { type: "mh1", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", customOrigin: { x: 50, y: 65 }, label: "Masthead (upper)" },
            { type: "mh2", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", customOrigin: { x: 50, y: 65 }, label: "Masthead (lower)" },
            { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", customOrigin: { x: 50, y: 75 }, label: "Sternlight" },
            { type: "pushing-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", customOrigin: { x: 40, y: 60 }, label: "Port Sidelight" },
            { type: "pushing-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", customOrigin: { x: 60, y: 60 }, label: "Starboard Sidelight" },
            { type: "pushed-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "pushed-port", label: "Pushed Vessels Port Sidelight" },
            { type: "pushed-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "pushed-starboard", label: "Pushed Vessels Starboard Sidelight" },
          ]
      },
      "Rigidly connected": {
          lights: [
            { id: "mh1", x: 77, y: 35, color: "white", label: "Masthead" },
            { id: "mh2", x: 10, y: 60, color: "white", label: "Masthead" },
            { id: "side", x: 70, y: 70, color: "red", label: "Port sidelight" },
            { id: "stern", x: 95, y: 70, color: "white", label: "Sternlight" },
          ],
          arcs: [
            { type: "mh1", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", customOrigin: { x: 50, y: 35 }, label: "Masthead" },
            { type: "mh2", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", customOrigin: { x: 50, y: 65 }, label: "Masthead" },
            { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", customOrigin: { x: 50, y: 75 }, label: "Sternlight" },
            { type: "pushing-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", customOrigin: { x: 40, y: 70 }, label: "Port Sidelight" },
            { type: "pushing-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", customOrigin: { x: 60, y: 70 }, label: "Starboard Sidelight" },

          ]
      },
      default: {
          lights: [
            { id: "mh1", x: 77, y: 35, color: "white", label: "Masthead (upper)" },
            { id: "mh2", x: 77, y: 45, color: "white", label: "Masthead (lower)" },
            { id: "side", x: 70, y: 70, color: "red", label: "Port sidelight" },
            { id: "side-pushed-obj", x: 3, y: 80, color: "red", label: "Port sidelight of pushed vessel" },
            { id: "stern", x: 95, y: 70, color: "white", label: "Sternlight" },
          ],
          arcs: [
            { type: "mh1", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", customOrigin: { x: 50, y: 65 }, label: "Masthead (upper)" },
            { type: "mh2", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", customOrigin: { x: 50, y: 65 }, label: "Masthead (lower)" },
            { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", customOrigin: { x: 50, y: 75 }, label: "Sternlight" },
            { type: "pushing-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", customOrigin: { x: 40, y: 60 }, label: "Port Sidelight" },
            { type: "pushing-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", customOrigin: { x: 60, y: 60 }, label: "Starboard Sidelight" },
            { type: "pushed-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", position: "pushed-port", label: "Pushed Vessel Port Sidelight" },
            { type: "pushed-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", position: "pushed-starboard", label: "Pushed Vessel Starboard Sidelight" },
          ]
      },
  },
  "seaplane": {
      "A seaplane": {
          lights: [
            { id: "mh", x: 83, y: 33, color: "white", label: "White light" },
            { id: "side-seaplane", x: 30, y: 50, color: "red", label: "Port sidelight" },
            { id: "stern", x: 85, y: 15, color: "white", label: "Sternlight" },
          ],
          arcs: [
              { type: "mh", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "center", label: "Masthead"},
              { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "stern", label: "Sternlight" },
              { type: "seaplane-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", customOrigin: { x: 30, y: 40 }, label: "Port Sidelight" },
              { type: "seaplane-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", customOrigin: { x: 70, y: 40 }, label: "Starboard Sidelight" },
          ]
      },
      "A WIG craft": {
          lights: [
            { id: "ar-red", x: 50, y: 42, color: "red", label: "All-round blinking red light", isAllRound: true },
            { id: "mh", x: 83, y: 33, color: "white", label: "White light" },
            { id: "side-seaplane", x: 30, y: 50, color: "red", label: "Port sidelight" },
            { id: "stern", x: 85, y: 15, color: "white", label: "Sternlight" },
          ],
          arcs: [
              { type: "mh", color: "white", arc: 225, startAngle: -112.5, range: "not-specified", position: "center", label: "Masthead"},
              { type: "stern", color: "white", arc: 135, startAngle: 112.5, range: "not-specified", position: "stern", label: "Sternlight" },
              { type: "ar-red1", color: "red", arc: 360, startAngle: 0, range: "not-specified", position: "center", label: "All-round Blinking Red" },
              { type: "seaplane-port", color: "red", arc: 112.5, startAngle: -112.5, range: "not-specified", customOrigin: { x: 30, y: 40 }, label: "Port Sidelight" },
              { type: "seaplane-stbd", color: "green", arc: 112.5, startAngle: 0, range: "not-specified", customOrigin: { x: 70, y: 40 }, label: "Starboard Sidelight" },
          ]
      },
      default: { lights: [], arcs: [] }
  },
};

/**
 * ---------------------------
 * GRAPHIC COMPONENTS (SILHOUETTES)
 * ---------------------------
 */

const TopViewHull = ({ width, height, type }: { width: number; height: number; type: VesselType }) => {
    const center = width / 2;
    const vWidth = width * 0.08;
    const vLength = height * 0.4;
    const yStart = height * 0.3;

    if (type === 'sailing') {
        return <path d={`M ${center} ${yStart} L ${center + vWidth * 0.8} ${yStart + vLength * 0.8} Q ${center} ${yStart + vLength} ${center - vWidth * 0.8} ${yStart + vLength * 0.8} Z`} fill="#1e293b" stroke="#334155" strokeWidth={2} />;
    }
    if (type === 'vessel-towing') {
        const tugYStart = height * 0.18; const tugLength = height * 0.22; const towedYStart = height * 0.55; const towedLength = height * 0.28; const towedWidth = vWidth * 1.4;
        return <g><path d={`M ${center} ${tugYStart} L ${center + vWidth * 1.1} ${tugYStart + tugLength * 0.3} L ${center + vWidth * 1.1} ${tugYStart + tugLength * 0.85} L ${center - vWidth * 1.1} ${tugYStart + tugLength * 0.85} L ${center - vWidth * 1.1} ${tugYStart + tugLength * 0.3} Z`} fill="#1e293b" stroke="#334155" strokeWidth={2} /><rect x={center - vWidth * 0.6} y={tugYStart + tugLength * 0.35} width={vWidth * 1.2} height={tugLength * 0.3} rx={2} fill="#334155" /><circle cx={center} cy={tugYStart + tugLength * 0.75} r={vWidth * 0.3} fill="#475569" stroke="#334155" strokeWidth={1} /><line x1={center} y1={tugYStart + tugLength * 0.9} x2={center} y2={towedYStart} stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" /><path d={`M ${center - towedWidth * 0.3} ${towedYStart} L ${center + towedWidth * 0.3} ${towedYStart} L ${center + towedWidth} ${towedYStart + towedLength * 0.15} L ${center + towedWidth} ${towedYStart + towedLength * 0.85} Q ${center} ${towedYStart + towedLength} ${center - towedWidth} ${towedYStart + towedLength * 0.85} L ${center - towedWidth} ${towedYStart + towedLength * 0.15} Z`} fill="#1e293b" stroke="#334155" strokeWidth={2} opacity={0.8} /><rect x={center - towedWidth * 0.5} y={towedYStart + towedLength * 0.3} width={towedWidth} height={towedLength * 0.4} rx={2} fill="#334155" opacity={0.5} /></g>;
    }
    if (type === 'vessel-pushing') {
        const pushedYStart = height * 0.18; const pushedLength = height * 0.28; const pushedWidth = vWidth * 1.6; const pusherYStart = height * 0.52; const pusherLength = height * 0.26;
        return <g><path d={`M ${center - pushedWidth * 0.4} ${pushedYStart} L ${center + pushedWidth * 0.4} ${pushedYStart} L ${center + pushedWidth} ${pushedYStart + pushedLength * 0.2} L ${center + pushedWidth} ${pushedYStart + pushedLength} L ${center - pushedWidth} ${pushedYStart + pushedLength} L ${center - pushedWidth} ${pushedYStart + pushedLength * 0.2} Z`} fill="#1e293b" stroke="#334155" strokeWidth={2} opacity={0.8} /><rect x={center - pushedWidth * 0.7} y={pushedYStart + pushedLength * 0.25} width={pushedWidth * 1.4} height={pushedLength * 0.5} rx={2} fill="#334155" opacity={0.5} /><rect x={center - vWidth * 0.5} y={pushedYStart + pushedLength - 2} width={vWidth} height={6} fill="#475569" /><path d={`M ${center - vWidth * 0.4} ${pusherYStart} L ${center - vWidth * 1.1} ${pusherYStart + pusherLength * 0.15} L ${center - vWidth * 1.1} ${pusherYStart + pusherLength * 0.85} Q ${center} ${pusherYStart + pusherLength} ${center + vWidth * 1.1} ${pusherYStart + pusherLength * 0.85} L ${center + vWidth * 1.1} ${pusherYStart + pusherLength * 0.15} L ${center + vWidth * 0.4} ${pusherYStart} Z`} fill="#1e293b" stroke="#334155" strokeWidth={2} /><rect x={center - vWidth * 0.6} y={pusherYStart + pusherLength * 0.4} width={vWidth * 1.2} height={pusherLength * 0.35} rx={2} fill="#334155" /></g>;
    }
    if (type === 'seaplane') {
        return <g><rect x={center - vWidth * 2.5} y={yStart + vLength * 0.2} width={vWidth * 5} height={vLength * 0.15} rx={2} fill="#1e293b" stroke="#334155" /><path d={`M ${center} ${yStart} L ${center + vWidth * 0.6} ${yStart + vLength * 0.3} L ${center + vWidth * 0.3} ${yStart + vLength} L ${center - vWidth * 0.3} ${yStart + vLength} L ${center - vWidth * 0.6} ${yStart + vLength * 0.3} Z`} fill="#334155" /><path d={`M ${center - vWidth * 0.8} ${yStart + vLength * 0.9} L ${center + vWidth * 0.8} ${yStart + vLength * 0.9} L ${center} ${yStart + vLength * 0.95} Z`} fill="#1e293b" /></g>
    }
    return <g><path d={`M ${center} ${yStart} L ${center + vWidth} ${yStart + vLength * 0.2} L ${center + vWidth} ${yStart + vLength * 0.8} Q ${center} ${yStart + vLength} ${center - vWidth} ${yStart + vLength * 0.8} L ${center - vWidth} ${yStart + vLength * 0.2} Z`} fill="#1e293b" stroke="#334155" strokeWidth={2} /><rect x={center - vWidth * 0.7} y={yStart + vLength * 0.5} width={vWidth * 1.4} height={vLength * 0.2} rx={2} fill="#334155" /></g>;
};

// --- 2D SILHOUETTES ---
const CargoSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.02} ${height * 0.74} L ${width * 0.02} ${height * 0.9} L ${width * 0.98} ${height * 0.9} L ${width * 0.98} ${height * 0.74} Z`} fill="#1e293b" /><rect x={width * 0.56} y={height * 0.5} width={width * 0.18} height={height * 0.24} fill="#334155" rx={1} /><rect x={width * 0.2} y={height * 0.3} width={width * 0.012} height={height * 0.44} fill="#1e293b" /><rect x={width * 0.64} y={height * 0.26} width={width * 0.01} height={height * 0.24} fill="#1e293b" /></g>);
const AheadSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.4} ${height * 0.72} L ${width * 0.6} ${height * 0.72} L ${width * 0.58} ${height * 0.88} L ${width * 0.42} ${height * 0.88} Z`} fill="#1e293b" /><rect x={width * 0.495} y={height * 0.3} width={width * 0.01} height={height * 0.4} fill="#1e293b" /><rect x={width * 0.45} y={height * 0.5} width={width * 0.1} height={height * 0.22} fill="#334155" /></g>);
const SternSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.4} ${height * 0.72} L ${width * 0.6} ${height * 0.72} L ${width * 0.58} ${height * 0.88} L ${width * 0.42} ${height * 0.88} Z`} fill="#1e293b" /><rect x={width * 0.495} y={height * 0.3} width={width * 0.01} height={height * 0.4} fill="#1e293b" /><rect x={width * 0.45} y={height * 0.5} width={width * 0.1} height={height * 0.22} fill="#334155" /></g>);
const SailSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.25} ${height * 0.78} L ${width * 0.3} ${height * 0.9} L ${width * 0.7} ${height * 0.9} L ${width * 0.75} ${height * 0.78} Z`} fill="#1e293b" /><rect x={width * 0.42} y={height * 0.3} width={width * 0.012} height={height * 0.48} fill="#1e293b" /><path d={`M ${width * 0.43} ${height * 0.32} L ${width * 0.43} ${height * 0.74} L ${width * 0.6} ${height * 0.74} Z`} fill="#334155" opacity="0.4" /></g>);
const SailAheadSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.42} ${height * 0.75} L ${width * 0.58} ${height * 0.75} L ${width * 0.5} ${height * 0.9} Z`} fill="#1e293b" /><rect x={width * 0.495} y={height * 0.2} width={width * 0.01} height={height * 0.7} fill="#1e293b" /></g>);
const SailSternSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.4} ${height * 0.72} L ${width * 0.6} ${height * 0.72} L ${width * 0.55} ${height * 0.88} L ${width * 0.45} ${height * 0.88} Z`} fill="#1e293b" /><rect x={width * 0.495} y={height * 0.3} width={width * 0.01} height={height * 0.5} fill="#1e293b" /></g>);
const SeaplaneSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.2} ${height * 0.82} L ${width * 0.8} ${height * 0.82} L ${width * 0.75} ${height * 0.92} L ${width * 0.25} ${height * 0.9} Z`} fill="#1e293b" /><path d={`M ${width * 0.35} ${height * 0.82} L ${width * 0.4} ${height * 0.65} L ${width * 0.42} ${height * 0.65} L ${width * 0.37} ${height * 0.82} Z`} fill="#1e293b" /><path d={`M ${width * 0.6} ${height * 0.82} L ${width * 0.55} ${height * 0.65} L ${width * 0.57} ${height * 0.65} L ${width * 0.62} ${height * 0.82} Z`} fill="#1e293b" /><path d={`M ${width * 0.15} ${height * 0.55} Q ${width * 0.5} ${height * 0.45} ${width * 0.9} ${height * 0.4} L ${width * 0.92} ${height * 0.25} L ${width * 0.8} ${height * 0.42} L ${width * 0.15} ${height * 0.65} Z`} fill="#334155" /><path d={`M ${width * 0.3} ${height * 0.5} L ${width * 0.6} ${height * 0.48} L ${width * 0.6} ${height * 0.52} L ${width * 0.3} ${height * 0.54} Z`} fill="#1e293b" /><rect x={width * 0.12} y={height * 0.52} width={width * 0.04} height={height * 0.15} fill="#1e293b" rx={2} /></g>);
const SeaplaneAheadSilhouette = ({ width, height }: { width: number; height: number }) => (<g><rect x={width * 0.1} y={height * 0.35} width={width * 0.8} height={height * 0.06} fill="#1e293b" rx={2} /><rect x={width * 0.45} y={height * 0.4} width={width * 0.1} height={height * 0.25} fill="#334155" rx={5} /><rect x={width * 0.25} y={height * 0.75} width={width * 0.12} height={height * 0.15} fill="#1e293b" rx={3} /><rect x={width * 0.63} y={height * 0.75} width={width * 0.12} height={height * 0.15} fill="#1e293b" rx={3} /><path d={`M ${width * 0.31} ${height * 0.75} L ${width * 0.45} ${height * 0.45} L ${width * 0.46} ${height * 0.45} L ${width * 0.32} ${height * 0.75} Z`} fill="#1e293b" opacity="0.8" /><path d={`M ${width * 0.69} ${height * 0.75} L ${width * 0.55} ${height * 0.45} L ${width * 0.54} ${height * 0.45} L ${width * 0.68} ${height * 0.75} Z`} fill="#1e293b" opacity="0.8" /><circle cx={width * 0.5} cy={height * 0.42} r={width * 0.03} fill="#1e293b" /></g>);
const SeaplaneSternSilhouette = ({ width, height }: { width: number; height: number }) => (<g><rect x={width * 0.1} y={height * 0.35} width={width * 0.8} height={height * 0.06} fill="#1e293b" rx={2} /><rect x={width * 0.35} y={height * 0.22} width={width * 0.3} height={height * 0.04} fill="#1e293b" rx={1} /><rect x={width * 0.48} y={height * 0.15} width={width * 0.04} height={height * 0.25} fill="#334155" /><rect x={width * 0.46} y={height * 0.4} width={width * 0.08} height={height * 0.2} fill="#334155" rx={5} /><rect x={width * 0.26} y={height * 0.75} width={width * 0.1} height={height * 0.15} fill="#1e293b" rx={3} /><rect x={width * 0.64} y={height * 0.75} width={width * 0.1} height={height * 0.15} fill="#1e293b" rx={3} /><path d={`M ${width * 0.31} ${height * 0.75} L ${width * 0.46} ${height * 0.42} Z`} stroke="#1e293b" strokeWidth={2} /><path d={`M ${width * 0.69} ${height * 0.75} L ${width * 0.54} ${height * 0.42} Z`} stroke="#1e293b" strokeWidth={2} /></g>);
const PushingSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.02} ${height * 0.76} L ${width * 0.05} ${height * 0.88} L ${width * 0.6} ${height * 0.88} L ${width * 0.6} ${height * 0.76} Z`} fill="#1e293b" /><rect x={width * 0.05} y={height * 0.72} width={width * 0.5} height={height * 0.08} fill="#334155" opacity="0.8" rx={1} /><path d={`M ${width * 0.62} ${height * 0.72} L ${width * 0.62} ${height * 0.88} L ${width * 0.95} ${height * 0.88} L ${width * 0.95} ${height * 0.72} Z`} fill="#1e293b" /><rect x={width * 0.70} y={height * 0.55} width={width * 0.15} height={height * 0.18} fill="#334155" rx={2} /><rect x={width * 0.765} y={height * 0.4} width={width * 0.015} height={height * 0.32} fill="#1e293b" /></g>);
const PushingAheadSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.2} ${height * 0.75} L ${width * 0.8} ${height * 0.75} L ${width * 0.75} ${height * 0.9} L ${width * 0.25} ${height * 0.9} Z`} fill="#1e293b" /><rect x={width * 0.25} y={height * 0.65} width={width * 0.5} height={height * 0.1} fill="#334155" opacity="0.6" /><rect x={width * 0.42} y={height * 0.45} width={width * 0.16} height={height * 0.2} fill="#334155" rx={2} /><rect x={width * 0.495} y={height * 0.3} width={width * 0.01} height={height * 0.35} fill="#1e293b" /></g>);
const PushingSternSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.35} ${height * 0.75} L ${width * 0.65} ${height * 0.75} L ${width * 0.6} ${height * 0.9} L ${width * 0.4} ${height * 0.9} Z`} fill="#1e293b" /><rect x={width * 0.42} y={height * 0.55} width={width * 0.16} height={height * 0.2} fill="#334155" rx={2} /><path d={`M ${width * 0.2} ${height * 0.8} L ${width * 0.34} ${height * 0.8} L ${width * 0.34} ${height * 0.85} L ${width * 0.25} ${height * 0.85} Z`} fill="#1e293b" opacity="0.6" /><path d={`M ${width * 0.66} ${height * 0.8} L ${width * 0.8} ${height * 0.8} L ${width * 0.75} ${height * 0.85} L ${width * 0.66} ${height * 0.85} Z`} fill="#1e293b" opacity="0.6" /><rect x={width * 0.495} y={height * 0.35} width={width * 0.01} height={height * 0.4} fill="#1e293b" /></g>);
const TowingSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.05} ${height * 0.75} L ${width * 0.1} ${height * 0.9} L ${width * 0.38} ${height * 0.9} L ${width * 0.38} ${height * 0.75} Z`} fill="#1e293b" /><rect x={width * 0.18} y={height * 0.6} width={width * 0.12} height={height * 0.15} fill="#334155" rx={2} /><rect x={width * 0.23} y={height * 0.45} width={width * 0.01} height={height * 0.3} fill="#1e293b" /><line x1={width * 0.38} y1={height * 0.8} x2={width * 0.62} y2={height * 0.75} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 2" /><path d={`M ${width * 0.62} ${height * 0.7} L ${width * 0.65} ${height * 0.88} L ${width * 0.98} ${height * 0.88} L ${width * 0.98} ${height * 0.7} Z`} fill="#1e293b" /><rect x={width * 0.85} y={height * 0.55} width={width * 0.1} height={height * 0.15} fill="#334155" /><rect x={width * 0.89} y={height * 0.35} width={width * 0.01} height={height * 0.35} fill="#1e293b" /></g>);
const TowingAheadSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.35} ${height * 0.75} L ${width * 0.65} ${height * 0.75} L ${width * 0.6} ${height * 0.9} L ${width * 0.4} ${height * 0.9} Z`} fill="#1e293b" /><rect x={width * 0.42} y={height * 0.55} width={width * 0.16} height={height * 0.2} fill="#334155" rx={2} /><rect x={width * 0.495} y={height * 0.35} width={width * 0.01} height={height * 0.4} fill="#1e293b" /><path d={`M ${width * 0.2} ${height * 0.65} L ${width * 0.3} ${height * 0.65} L ${width * 0.3} ${height * 0.8} L ${width * 0.25} ${height * 0.8} Z`} fill="#1e293b" opacity="0.5" /><path d={`M ${width * 0.7} ${height * 0.65} L ${width * 0.8} ${height * 0.65} L ${width * 0.75} ${height * 0.8} L ${width * 0.7} ${height * 0.8} Z`} fill="#1e293b" opacity="0.5" /></g>);
const TowingSternSilhouette = ({ width, height }: { width: number; height: number }) => (<g><path d={`M ${width * 0.3} ${height * 0.7} L ${width * 0.7} ${height * 0.7} L ${width * 0.65} ${height * 0.9} L ${width * 0.35} ${height * 0.9} Z`} fill="#1e293b" /><rect x={width * 0.4} y={height * 0.5} width={width * 0.2} height={height * 0.2} fill="#334155" /><rect x={width * 0.495} y={height * 0.3} width={width * 0.01} height={height * 0.4} fill="#1e293b" /></g>);

// --- RENDERERS ---

function getEffectiveRange(range: number | "not-specified" | undefined): number {
    if (range === undefined || range === "not-specified") return 3;
    return range;
}

function LightArcRenderer({ light, size, index, animated, onInteract, isDimmed = false, allArcs }: { light: ArcConfig; size: number; index: number; animated: boolean; onInteract: (l: ArcConfig | null, e: any, allArcs?: ArcConfig[]) => void; isDimmed?: boolean; allArcs?: ArcConfig[] }) {
    const center = size / 2;
    const baseRadius = size * 0.35;
    const effectiveRange = getEffectiveRange(light.range);
    const radius = baseRadius * (effectiveRange >= 6 ? 1 : effectiveRange >= 3 ? 0.75 : 0.55);
    
    let origin = { x: center, y: center };

    if (light.customOrigin) {
        origin = { x: (light.customOrigin.x / 100) * size, y: (light.customOrigin.y / 100) * size };
    } else {
        const offset = size * 0.08;
        const mastOffset = size * 0.12;
        
        if (light.position === "port") origin.x -= offset;
        if (light.position === "starboard") origin.x += offset;
        if (light.position === "stern") origin.y += offset * 2;
        if (light.position === "fore-mast") origin.y -= mastOffset;
        if (light.position === "aft-mast") origin.y += mastOffset;
        
        const tugCenterY = size * 0.29; const tugWidth = size * 0.08 * 1.1;
        if (light.position === "tug-center") { origin.x = center; origin.y = tugCenterY; }
        if (light.position === "tug-fore-mast") { origin.x = center; origin.y = size * 0.22; }
        if (light.position === "tug-stern") { origin.x = center; origin.y = size * 0.37; }
        if (light.position === "tug-port") { origin.x = center - tugWidth; origin.y = tugCenterY; }
        if (light.position === "tug-starboard") { origin.x = center + tugWidth; origin.y = tugCenterY; }

        const towedCenterY = size * 0.69; const towedWidth = size * 0.08 * 1.4;
        if (light.position === "towed-fore") { origin.x = center; origin.y = size * 0.55; }
        if (light.position === "towed-aft") { origin.x = center; origin.y = size * 0.83; }
        if (light.position === "towed-port") { origin.x = center - towedWidth; origin.y = towedCenterY; }
        if (light.position === "towed-starboard") { origin.x = center + towedWidth; origin.y = towedCenterY; }

        const pusherCenterY = size * 0.65; const pusherWidth = size * 0.08 * 1.1;
        if (light.position === "pusher-center") { origin.x = center; origin.y = pusherCenterY; }
        if (light.position === "pusher-fore-mast") { origin.x = center; origin.y = size * 0.56; }
        if (light.position === "pusher-stern") { origin.x = center; origin.y = size * 0.78; }
        if (light.position === "pusher-port") { origin.x = center - pusherWidth; origin.y = pusherCenterY; }
        if (light.position === "pusher-starboard") { origin.x = center + pusherWidth; origin.y = pusherCenterY; }

        const pushedCenterY = size * 0.32; const pushedWidth = size * 0.08 * 1.6;
        if (light.position === "pushed-fore") { origin.x = center; origin.y = size * 0.18; }
        if (light.position === "pushed-center") { origin.x = center; origin.y = pushedCenterY; }
        if (light.position === "pushed-port") { origin.x = center - pushedWidth; origin.y = pushedCenterY; }
        if (light.position === "pushed-starboard") { origin.x = center + pushedWidth; origin.y = pushedCenterY; }
    }

    const isAllRound = light.arc >= 360;
    const pathD = isAllRound
        ? `M ${origin.x} ${origin.y - radius} A ${radius} ${radius} 0 1 1 ${origin.x} ${origin.y + radius} A ${radius} ${radius} 0 1 1 ${origin.x} ${origin.y - radius}`
        : describeArc(origin.x, origin.y, radius, light.startAngle, light.startAngle + light.arc);

    const colors = LIGHT_COLORS[light.color];
    const dimmedOpacity = isDimmed ? 0.15 : 1;

    return (
        <motion.g
            initial={animated ? { opacity: 0, scale: 0.9 } : undefined}
            animate={animated ? { opacity: dimmedOpacity, scale: 1 } : undefined}
            transition={{ delay: index * 0.1, opacity: { duration: 0.15 } }}
            onMouseEnter={(e) => onInteract(light, e, allArcs)}
            onMouseLeave={(e) => onInteract(null, e)}
            onClick={(e) => { e.stopPropagation(); onInteract(light, e, allArcs); }}
            style={{ cursor: 'pointer', opacity: animated ? undefined : dimmedOpacity }}
        >
            <path d={pathD} fill={colors.arcFill} stroke={colors.stroke} strokeWidth={1.5} />
            {!isAllRound && (
                <g>
                    <line x1={origin.x} y1={origin.y} x2={polarToCartesian(origin.x, origin.y, radius, light.startAngle).x} y2={polarToCartesian(origin.x, origin.y, radius, light.startAngle).y} stroke={colors.stroke} strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
                    <line x1={origin.x} y1={origin.y} x2={polarToCartesian(origin.x, origin.y, radius, light.startAngle + light.arc).x} y2={polarToCartesian(origin.x, origin.y, radius, light.startAngle + light.arc).y} stroke={colors.stroke} strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
                </g>
            )}
            <circle cx={origin.x} cy={origin.y} r={3} fill={colors.stroke} />
        </motion.g>
    );
}

function LightDot({ config, width, height, animated, index, onInteract, isDimmed = false, allArcs }: { config: LightConfig; width: number; height: number; animated: boolean; index: number; onInteract: (l: any, e:any, arcs?: ArcConfig[]) => void; isDimmed?: boolean; allArcs?: ArcConfig[] }) {
    const colors = LIGHT_COLORS[config.color];
    const x = (config.x / 100) * width;
    const y = (config.y / 100) * height;
    const radius = Math.min(width, height) * 0.032;
    const dimmedOpacity = isDimmed ? 0.15 : 1;

    return (
      <motion.g
        initial={animated ? { opacity: 0, scale: 0 } : undefined}
        animate={animated ? { opacity: dimmedOpacity, scale: 1 } : undefined}
        transition={{ delay: 0.1 + index * 0.05, opacity: { duration: 0.15 } }}
        onMouseEnter={(e) => onInteract(config, e, allArcs)}
        onMouseLeave={(e) => onInteract(null, e)}
        onClick={(e) => { e.stopPropagation(); onInteract(config, e, allArcs); }}
        style={{ opacity: animated ? undefined : dimmedOpacity }}
      >
        <circle cx={x} cy={y} r={radius * 6} fill="transparent" style={{ cursor: "pointer", pointerEvents: "all" }} />
        <circle cx={x} cy={y} r={radius * 4} fill={colors.fill} opacity={0.15} style={{ pointerEvents: "none" }} />
        <circle cx={x} cy={y} r={radius} fill={colors.fill} style={{ pointerEvents: "none", filter: `drop-shadow(0 0 6px ${colors.glow})` }} />
      </motion.g>
    );
}

/**
 * ---------------------------
 * MAIN COMPONENT
 * ---------------------------
 */

const VIEW_ORDER: ViewAngle[] = ["port", "stern", "starboard", "ahead"];

export default function VesselLights({
  type = "power-driven",
  length: initialLength,
  size = "md",
  animated = true,
  showLabels = true
}: VesselLightsProps) {
  const [view, setView] = useState<ViewAngle>("port");
  const [hoveredLights, setHoveredLights] = useState<(LightConfig | ArcConfig)[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  
  // Ref for clearing the auto-dismiss timer
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { width, height, topSize } = SIZE_CONFIG[size];

  // Logic to handle fallback configurations
  const typeConfig = VESSEL_LIGHT_CONFIGS[type] || VESSEL_LIGHT_CONFIGS["power-driven"];

  // Navigation Logic
  const handleNextView = () => {
    const currentIndex = VIEW_ORDER.indexOf(view);
    const nextIndex = (currentIndex + 1) % VIEW_ORDER.length;
    setView(VIEW_ORDER[nextIndex]);
  };

  const handlePrevView = () => {
    const currentIndex = VIEW_ORDER.indexOf(view);
    const prevIndex = (currentIndex - 1 + VIEW_ORDER.length) % VIEW_ORDER.length;
    setView(VIEW_ORDER[prevIndex]);
  };

  // Interaction Logic (Unified Mouse/Touch)
  const handleLightInteract = useCallback((light: LightConfig | ArcConfig | null, event: any, allArcs?: ArcConfig[]) => {
    // Clear existing timer if any new interaction happens
    if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
    }

    if (!light) {
        // If event type was mouseleave, we clear immediately. 
        // If it's a click/tap on background, we clear immediately.
        
        // If it's a mouse event (not touch/click), clear immediately
        if (event?.type === 'mouseleave') {
             setHoveredLights([]);
             setHighlightedIds(new Set());
        }
        return;
    }

    // Identify lights
    let lightsToHighlight: (LightConfig | ArcConfig)[] = [light];

    // For arcs, find overlapping ones
    if ('arc' in light && allArcs) {
      const hoveredPosition = light.customOrigin || light.position || 'center';
      const lightsAtPosition = allArcs.filter(arc => {
        const arcPosition = arc.customOrigin || arc.position || 'center';
        if (typeof hoveredPosition === 'string' && typeof arcPosition === 'string') return hoveredPosition === arcPosition;
        if (typeof hoveredPosition === 'object' && typeof arcPosition === 'object') {
          return Math.abs(hoveredPosition.x - arcPosition.x) < 5 && Math.abs(hoveredPosition.y - arcPosition.y) < 5;
        }
        return false;
      });
      if (lightsAtPosition.length > 0) lightsToHighlight = lightsAtPosition;
    } else if (!('arc' in light) && allArcs) {
      // For LightConfig (side view), find matching arcs to show detailed info
      const lightConfig = light as LightConfig;
      const lightId = lightConfig.id.toLowerCase();
      const lightColor = lightConfig.color;
      const matchingArcs = allArcs.filter(arc => {
        const arcType = arc.type.toLowerCase();
        // Match by checking if arc type contains the light id or vice versa
        const idMatch = arcType.includes(lightId) || lightId.includes(arcType.replace(/-.*$/, ''));
        if (!idMatch) return false;
        // For sidelights, also match by color to be more precise
        if (arcType.includes('side') && lightId.includes('side')) {
          return arc.color === lightColor;
        }
        return true;
      });
      if (matchingArcs.length > 0) {
        lightsToHighlight = matchingArcs;
      }
    }

    setHoveredLights(lightsToHighlight);
    
    // Set Highlight IDs
    const allIds = new Set<string>();
    lightsToHighlight.forEach(l => {
      const lightId = 'type' in l ? l.type as string : l.id;
      getRelatedLightIds(lightId).forEach(id => allIds.add(id.toLowerCase()));
    });
    setHighlightedIds(allIds);

    // If this is a click event (or touch), set a timer to dismiss
    if (event?.type === 'click') {
        dismissTimerRef.current = setTimeout(() => {
            setHoveredLights([]);
            setHighlightedIds(new Set());
        }, 5000);
    }

  }, []);

  // Background click handler to dismiss
  const handleBackgroundClick = () => {
      setHoveredLights([]);
      setHighlightedIds(new Set());
      if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
      }
  };

  const availableLengths = Object.keys(typeConfig).filter(k => k !== "default");
  const [lengthState, setLengthState] = useState<LengthCategory>(() => {
    if (initialLength && availableLengths.includes(initialLength)) return initialLength;
    if (availableLengths.length > 0) return availableLengths[0] as LengthCategory;
    return "default";
  });

  const currentConfig = typeConfig[lengthState as string] || typeConfig["default"];

  // Prepare lights for 2D views (Filtering logic)
  const visible2DLights = useMemo(() => {
    const baseLights = currentConfig.lights || [];
    return baseLights.filter((l) => {
      if (l.isAllRound) return true;
      if (l.id.includes("towing") && view !== "stern") return false;
      if (view === "ahead") return !l.id.includes("stern") && !l.id.includes("towing");
      if (view === "stern") return l.id.includes("stern") || l.id.includes("towing");
      return !l.id.includes("stern") && !l.id.includes("towing");
    }).flatMap((l) => {
        let xPos = l.x;
        let color = l.color;
        let label = l.label;
        let id = l.id;

        // View transformations
        if (view === "starboard") {
            xPos = 100 - l.x;
            if (l.id.includes("side")) {
                color = "green";
                label = label.replace("Port", "Starboard");
            }
        } else if (view === "ahead") {
            if (l.id.includes("ar-green-unique1")) { return [{ ...l, id: "ar-green-unique1", x: 55, color: "green" as const, label: "All-round Green" }]; } 
            else if (l.id.includes("ar-green-unique2")) { return [{ ...l, id: "ar-green-unique2", x: 45, color: "green" as const, label: "All-round Green" }]; } 
            else if (l.id.includes("ar-green-unique")) { return [{ ...l, id: "ar-green-unique", x: 50, color: "green" as const, label: "All-round Green" }]; } 
            else if (l.id.includes("ar-white-gear")) { return [{ ...l, id: "ar-white-gear", x: 45, color: "white" as const, label: "All-round white (in direction of gear)" }]; } 
            else if (l.id.includes("middle-tow")) { return [{ ...l, id: "middle-tow1", x: 45, color: "white" as const, label: "Middle White Light (Towed)" }, { ...l, id: "middle-tow2", x: 50, color: "white" as const, label: "Middle White Light (Towed)" }, { ...l, id: "middle-tow3", x: 55, color: "white" as const, label: "Middle White Light (Towed)" }]; } 
            else if (l.id.includes("tricolor-side")) { return [{ ...l, id: "tricolor-side2", x: 48, color: "green" as const, label: "Starboard sidelight of tricolor lantern" }, { ...l, id: "tricolor-side1", x: 52, color: "red" as const, label: "Starboard sidelight of tricolor lantern" }]; } 
            else if (l.id.includes("side-tow")) { return [{ ...l, id: "stbd-side", x: 22, color: "green" as const, label: "Starboard sidelight of towed vessel" }, { ...l, id: "port-side", x: 78, color: "red" as const, label: "Port sidelight of towed vessel" }]; } 
            else if (l.id.includes("side-pushed-obj")) { return [{ ...l, id: "stbd-side", x: 20, color: "green" as const, label: "Starboard side of pushed vessel" }, { ...l, id: "port-side", x: 80, color: "red" as const, label: "Port side of pushed vessel" }]; } 
            else if (l.id.includes("side-seaplane")) { return [{ ...l, id: "side-seaplane-port", x: 90, y: 45, color: "red" as const, label: "Port sidelight" }, { ...l, id: "side-seaplane-starboard", x: 10, y: 45, color: "green" as const, label: "Starboard sidelight" }]; } 
            else if (l.id.includes("side")) { return [{ ...l, id: "side-stbd", x: 42, color: "green" as const, label: "Starboard sidelight" }, { ...l, id: "side-port", x: 58, color: "red" as const, label: "Port sidelight" }]; } 
            else if (l.id.includes("obstruction")) { return [{ ...l, id: "free-way", x: 45, color: "green" as const, label: "Vessel may pass" }, { ...l, id: "obstruction", x: 55, color: "red" as const, label: "Obstruction exists" }]; } 
            xPos = 50; 
        } else if (view === "stern") {
             if (l.isAllRound) {
                if (l.id.includes("obstruction")) { return [{ ...l, id: "free-way", x: 55, color: "green" as const, label: "Vessel may pass" }, { ...l, id: "obstruction", x: 45, color: "red" as const, label: "Obstruction exists" }]; } 
                else if (l.id.includes("middle-tow")) { return [{ ...l, id: "middle-tow1", x: 45, color: "white" as const, label: "Middle White Light (Towed)" }, { ...l, id: "middle-tow2", x: 50, color: "white" as const, label: "Middle White Light (Towed)" }, { ...l, id: "middle-tow3", x: 55, color: "white" as const, label: "Middle White Light (Towed)" }]; } 
                else if (l.id.includes("ar-white-gear")) { return [{ ...l, id: "ar-white-gear", x: 55, color: "white" as const, label: "All-round white (in direction of gear)" }]; } 
                else if (l.id.includes("ar-green-unique1")) { return [{ ...l, id: "ar-green-unique1", x: 55, color: "green" as const, label: "All-round Green" }]; } 
                else if (l.id.includes("ar-green-unique2")) { return [{ ...l, id: "ar-green-unique2", x: 45, color: "green" as const, label: "All-round Green" }]; }
             }
             xPos = 50;
        }

        return [{ ...l, id, x: xPos, color, label }];
    });
  }, [type, lengthState, view, currentConfig]);

  // Dimensions
  const topViewSize = Math.min(topSize, height * 1.2);
  // We use aspect ratio logic for mobile sizing
  const aspect2D = width / height;

  // Eye Icon Rotation Logic
  const getEyePosition = () => {
      const inset = 0;
      switch(view) {
          case "port": return { left: inset, top: '50%', transform: 'translateY(-50%) rotate(-90deg)' };
          case "starboard": return { right: inset, top: '50%', transform: 'translateY(-50%) rotate(90deg)' };
          case "ahead": return { top: inset, left: '50%', transform: 'translateX(-50%) rotate(180deg)' };
          case "stern": return { bottom: inset, left: '50%', transform: 'translateX(-50%)' };
      }
  }

  return (
    <div className="flex flex-col items-center gap-6 relative w-full max-w-4xl mx-auto p-4 select-none" onClick={handleBackgroundClick}>

      {/* GRAPHIC CONTAINERS WRAPPER */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center w-full">
        
        {/* --- 2D VIEW SECTION --- */}
        <div className="flex flex-col gap-2 w-full md:w-auto items-center">
            {/* External Header */}
            <div className="text-[12px] text-slate-500 uppercase tracking-wider font-bold w-full text-center pl-1">
                {view} View
            </div>

            {/* Container for View + Arrows */}
            <div className="flex items-center justify-center w-full">
                {/* Left Arrow (Outside) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handlePrevView(); }}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="Previous View"
                >
                    <ChevronLeft />
                </button>

                {/* The Window */}
                <div 
                    className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-xl transition-all duration-300 group"
                    style={{ 
                        width: '100%', 
                        maxWidth: width * 1.2, 
                        aspectRatio: aspect2D 
                    }}
                >
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                        <rect width="100%" height="100%" fill="#0f172a" />
                        <g style={{ transform: view === "starboard" ? "scaleX(-1)" : undefined, transformOrigin: "center" }}>
                        {view === "ahead" ? (
                            type === "sailing" ? <SailAheadSilhouette width={width} height={height} /> :
                            type === "seaplane" ? <SeaplaneAheadSilhouette width={width} height={height} /> :
                            type === "vessel-pushing" ? <PushingAheadSilhouette width={width} height={height} /> :
                            type === "vessel-towing" ? <TowingAheadSilhouette width={width} height={height} /> :
                            <AheadSilhouette width={width} height={height} />
                        ) : view === "stern" ? (
                            type === "sailing" ? <SailSternSilhouette width={width} height={height} /> :
                            type === "seaplane" ? <SeaplaneSternSilhouette width={width} height={height} /> :
                            type === "vessel-pushing" ? <PushingSternSilhouette width={width} height={height} /> :
                            type === "vessel-towing" ? <TowingSternSilhouette width={width} height={height} /> :
                            <SternSilhouette width={width} height={height} />
                        ) : (
                            type === "sailing" ? <SailSilhouette width={width} height={height} /> :
                            type === "seaplane" ? <SeaplaneSilhouette width={width} height={height} /> :
                            type === "vessel-pushing" ? <PushingSilhouette width={width} height={height} /> :
                            type === "vessel-towing" ? <TowingSilhouette width={width} height={height} /> :
                            <CargoSilhouette width={width} height={height} />
                        )}
                        </g>
                        {[...visible2DLights].sort((a, b) => b.y - a.y).map((l, i) => (
                        <LightDot
                            key={`${l.id}-${i}`}
                            config={l}
                            width={width}
                            height={height}
                            animated={animated}
                            index={i}
                            onInteract={handleLightInteract}
                            isDimmed={highlightedIds.size > 0 && !shouldHighlight(l.id, '', highlightedIds)}
                            allArcs={currentConfig.arcs || []}
                        />
                        ))}
                    </svg>
                </div>

                {/* Right Arrow (Outside) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleNextView(); }}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="Next View"
                >
                    <ChevronRight />
                </button>
            </div>
        </div>

        {/* --- TOP VIEW CONTAINER --- */}
        <div className="flex flex-col gap-2 w-full md:w-auto items-center">
            <div className="text-[12px] text-slate-500 uppercase tracking-wider font-bold w-full text-center pl-1">
                Top View
            </div>

            <div 
                className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-xl transition-all duration-300"
                style={{ 
                    width: '100%', 
                    maxWidth: topViewSize, 
                    aspectRatio: 1 
                }}
            >
                <svg width="100%" height="100%" viewBox={`0 0 ${topViewSize} ${topViewSize}`}>
                    <rect width="100%" height="100%" fill="#0f172a" />
                    <line x1={topViewSize/2} y1={0} x2={topViewSize/2} y2={topViewSize} stroke="#1e293b" strokeDasharray="4 4" />
                    <line x1={0} y1={topViewSize/2} x2={topViewSize} y2={topViewSize/2} stroke="#1e293b" strokeDasharray="4 4" />

                    <TopViewHull width={topViewSize} height={topViewSize} type={type as VesselType} />

                    {currentConfig.arcs && [...currentConfig.arcs].sort((a, b) => {
                    const yDiff = getArcOriginY(b) - getArcOriginY(a);
                    if (yDiff !== 0) return yDiff;
                    return b.arc - a.arc;
                    }).map((arc, i) => (
                    <LightArcRenderer
                        key={`arc-${arc.type}-${i}`}
                        light={arc}
                        size={topViewSize}
                        index={i}
                        animated={animated}
                        onInteract={handleLightInteract}
                        isDimmed={highlightedIds.size > 0 && !shouldHighlight(arc.type as string, arc.type as string, highlightedIds)}
                        allArcs={currentConfig.arcs}
                    />
                    ))}
                </svg>

                {/* EYE INDICATOR */}
                <div 
                    className="absolute text-slate-500/50 pointer-events-none transition-all duration-500 ease-in-out"
                    style={getEyePosition()}
                >
                    <EyeIcon />
                </div>
            </div>
        </div>
      </div>

      {/* LENGTH/OPTION TOGGLES */}
      {availableLengths.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {availableLengths.map((len) => (
            <button
              key={len}
              onClick={(e) => { e.stopPropagation(); setLengthState(len as LengthCategory); }}
              className={`px-2 py-1 text-[10px] rounded transition-colors border ${
                lengthState === len ? "bg-slate-700 text-slate-200 border-slate-500" : "bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700"
              }`}
            >
              {len.replace("under", "< ").replace("over", "> ")}
            </button>
          ))}
        </div>
      )}

      {/* HOVER TOOLTIP (below all options) */}
      <AnimatePresence>
        {hoveredLights.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-2 bg-slate-800/95 border border-slate-700 px-4 py-3 rounded-lg text-xs backdrop-blur-md shadow-2xl pointer-events-none min-w-[200px]"
          >
            {hoveredLights.map((light, idx) => (
              <div key={idx} className={idx > 0 ? "mt-2 pt-2 border-t border-slate-700" : ""}>
                <div className="flex items-center gap-2 text-slate-100 font-semibold">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LIGHT_COLORS[light.color].fill }} />
                  <span>{light.label}</span>
                </div>
                {'arc' in light && (
                  <div className="text-[10px] text-slate-400 flex gap-2 mt-0.5 ml-4">
                    <span>{light.arc}° Arc</span>
                    {typeof light.range === 'number' && (
                      <span>{light.range} NM Range</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}