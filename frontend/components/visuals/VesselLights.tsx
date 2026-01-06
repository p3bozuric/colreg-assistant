"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TYPES & INTERFACES
 */

export type VesselType =
  | "power-driven"
  | "sailing"
  | "fishing"
  | "trawling"
  | "nuc"
  | "ram"
  | "ram-underwater"
  | "ram-mine-clearance"
  | "cbd"
  | "towing"
  | "pushing"
  | "anchored"
  | "aground"
  | "pilot"
  | "seaplane";

export type LengthCategory = "under7m" | "under12m" | "under20m" | "over20m" | "over20m-optional" | "under50m" | "over50m";

export type ViewAngle = "port" | "starboard" | "ahead" | "stern";

interface LightConfig {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  color: "white" | "red" | "green" | "yellow";
  label: string;
  range?: number;
  isAllRound?: boolean;
}

interface VesselLightsProps {
  type?: VesselType;
  length?: LengthCategory;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  showLabels?: boolean;
}

/**
 * CONSTANTS
 */

export const VESSEL_TYPES: Record<VesselType, string> = {
  "power-driven": "Power-driven vessel making way",
  sailing: "Sailing vessel underway & vessel under oars",
  fishing: "Vessel engaged in fishing (other than trawling)",
  trawling: "Vessel engaged in trawling",
  nuc: "Vessel not under command",
  ram: "Restricted manueverability",
  "ram-underwater": "Restricted manueverability - underwater operations",
  "ram-mine-clearance": "Restricted manueverability - mine clearance",
  cbd: "Vessel constrained by her draught",
  towing: "Power-driven vessel towing",
  pushing: "Power-driven vessel pushing ahead",
  anchored: "Vessel at anchor",
  aground: "Vessel aground",
  pilot: "Pilot vessel on duty",
  seaplane: "Seaplanes"
};

const SIZE_CONFIG = {
  sm: { width: 260, height: 130 },
  md: { width: 340, height: 170 },
  lg: { width: 440, height: 220 },
};

const LIGHT_COLORS: Record<string, { fill: string; glow: string }> = {
  white: { fill: "#ffffff", glow: "rgba(255, 255, 255, 0.9)" },
  red: { fill: "#ef4444", glow: "rgba(239, 68, 68, 0.9)" },
  green: { fill: "#22c55e", glow: "rgba(34, 197, 94, 0.9)" },
  yellow: { fill: "#eab308", glow: "rgba(234, 179, 8, 0.9)" },
};

const VESSEL_LIGHT_CONFIGS: Record<VesselType, Record<string, LightConfig[]>> = {
  "power-driven": {
    "Under 12m": [
      { id: "mh", x: 66, y: 22, color: "white", label: "Masthead", range: 3 },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight", range: 2 },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: 2 },
    ],
    "Under 20m": [
      { id: "mh", x: 66, y: 22, color: "white", label: "Masthead", range: 3 },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight", range: 2 },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: 2 },
    ],
    "Under 50m": [
      { id: "mh", x: 66, y: 22, color: "white", label: "Masthead", range: 5 },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight", range: 2 },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: 2 },
    ],
    "Over 50m": [
      { id: "mh-fore", x: 22, y: 26, color: "white", label: "Masthead (fore)", range: 6 },
      { id: "mh-aft", x: 66, y: 22, color: "white", label: "Masthead (aft)", range: 6 },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight", range: 3 },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: 3 },
    ],
    default: [
      { id: "mh-fore", x: 22, y: 26, color: "white", label: "Masthead (fore)", range: 6 },
      { id: "mh-aft", x: 66, y: 22, color: "white", label: "Masthead (aft)", range: 6 },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight", range: 3 },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight", range: 3 },
    ],
  },
  sailing: {
    "Under 7m": [
      { id: "ar-white", x: 65, y: 75, color: "white", label: "Handheld lantern", isAllRound: true},
    ],
    "Under 20m": [
      { id: "stern", x: 42, y: 26, color: "white", label: "Tricolor lantern", range: 2 },
      { id: "side", x: 42, y: 26, color: "red", label: "Tricolor lantern", range: 2 },
    ],
    "Over 20m": [
      { id: "side", x: 28, y: 68, color: "red", label: "Port sidelight", range: 2 },
      { id: "stern", x: 68, y: 68, color: "white", label: "Sternlight", range: 2 },
    ],
    "Over 20m - Additional": [
      { id: "ar-red", x: 42, y: 20, color: "red", label: "All-round red (upper)", range: 2, isAllRound: true },
      { id: "ar-green", x: 42, y: 30, color: "green", label: "All-round green (lower)", range: 2,isAllRound: true },
      { id: "side", x: 28, y: 68, color: "red", label: "Port sidelight", range: 2 },
      { id: "stern", x: 68, y: 68, color: "white", label: "Sternlight", range: 2 },
    ],
    default: [
      { id: "ar-red", x: 42, y: 20, color: "red", label: "All-round red (upper)", range: 2, isAllRound: true },
      { id: "ar-green", x: 42, y: 30, color: "green", label: "All-round green (lower)", range: 2,isAllRound: true },
      { id: "side", x: 28, y: 68, color: "red", label: "Port sidelight", range: 2 },
      { id: "stern", x: 68, y: 68, color: "white", label: "Sternlight", range: 2 },    ],
  },
  fishing: {
    "Making way": [
      { id: "ar-red", x: 22, y: 28, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 42, color: "white", label: "All-round white (lower)", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
    "Making way (+150m)": [
      { id: "ar-red", x: 22, y: 28, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 42, color: "white", label: "All-round white (lower)", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      { id: "ar-white", x: 50, y: 60, color: "white", label: "All-round white (in direction of gear)", isAllRound: true },

    ],
    "Not making way": [
      { id: "ar-red", x: 22, y: 28, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 42, color: "white", label: "All-round white (lower)", isAllRound: true },
    ],
    "Not making way (+150m)": [
      { id: "ar-red", x: 22, y: 28, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 42, color: "white", label: "All-round white (lower)", isAllRound: true },
      { id: "ar-white", x: 50, y: 60, color: "white", label: "All-round white (in direction of gear)", isAllRound: true },
    ],
    default: [
      { id: "ar-red", x: 22, y: 28, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 42, color: "white", label: "All-round white (lower)", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
  },
  trawling: {
    "Making way": [
      { id: "ar-green", x: 22, y: 28, color: "green", label: "All-round green (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 42, color: "white", label: "All-round white (lower)", isAllRound: true },
      { id: "mh", x: 66, y: 22, color: "white", label: "Masthead"},
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
    "Not making way": [
      { id: "ar-green", x: 22, y: 28, color: "green", label: "All-round green (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 42, color: "white", label: "All-round white (lower)", isAllRound: true },
      { id: "mh", x: 66, y: 22, color: "white", label: "Masthead"},
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
    default: [
      { id: "ar-green", x: 22, y: 28, color: "green", label: "All-round green (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 42, color: "white", label: "All-round white (lower)", isAllRound: true },
      { id: "mh", x: 66, y: 22, color: "white", label: "Masthead"},
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
  },
  nuc: {
    "Making way": [
      { id: "ar-red1", x: 22, y: 28, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 42, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      
    ],
    "Not making way": [
      { id: "ar-red1", x: 22, y: 28, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 42, color: "red", label: "All-round red (lower)", isAllRound: true },
    ],
    default: [
      { id: "ar-red1", x: 22, y: 28, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 42, color: "red", label: "All-round red (lower)", isAllRound: true },
    ],
  },
  ram: {
    "Making way": [
      { id: "ar-red1", x: 22, y: 35, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 45, color: "white", label: "All-round white (middle)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 55, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      { id: "mh-fore", x: 22, y: 25, color: "white", label: "Masthead (fore)"},
      { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)"},
    ],
    "Not making way": [
      { id: "ar-red1", x: 22, y: 35, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 45, color: "white", label: "All-round white (middle)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 55, color: "red", label: "All-round red (lower)", isAllRound: true },
    ],
    "At anchor": [
      { id: "ar-red1", x: 22, y: 35, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 45, color: "white", label: "All-round white (middle)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 55, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "anchor-fore", x: 22, y: 26, color: "white", label: "Anchor (fore)", isAllRound: true },
      { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true },
      { id: "mr-anchor-deck", x: 48, y: 60, color: "white", label: "Anchor (deck lights)"},
    ],
    "Towing": [
      { id: "mh-white-1", x: 22, y: 5, color: "white", label: "All-round white (middle)"},
      { id: "mh-white-2", x: 22, y: 15, color: "white", label: "All-round white (middle)"},
      { id: "mh-white-3", x: 22, y: 25, color: "white", label: "All-round white (middle)"},
      { id: "ar-red1", x: 22, y: 35, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 45, color: "white", label: "All-round white (middle)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 55, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 74, color: "white", label: "Sternlight" },
      { id: "towing", x: 94, y: 64, color: "yellow", label: "Towing light" },
    ],
    "Diving operations": [
      { id: "ar-red1", x: 22, y: 35, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 45, color: "white", label: "All-round white (middle)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 55, color: "red", label: "All-round red (lower)", isAllRound: true },
    ],
    default: [
      { id: "ar-red1", x: 22, y: 22, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 34, color: "white", label: "All-round white (middle)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 46, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
  },
  "ram-underwater": {
    "Making way": [
      { id: "ar-red1", x: 22, y: 35, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 55, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "ar-white", x: 22, y: 45, color: "white", label: "All-round white (middle)", isAllRound: true },
      { id: "obstruction", x: 55, y: 64, color: "red", label: "Obstruction exists", isAllRound: true },
      { id: "obstruction-2", x: 55, y: 74, color: "red", label: "Obstruction exists", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "mh-fore", x: 22, y: 25, color: "white", label: "Masthead (fore)"},
      { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)"},
    ],
    "Not making way": [
      { id: "ar-red1", x: 22, y: 35, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 55, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "ar-white", x: 22, y: 45, color: "white", label: "All-round white (middle)", isAllRound: true },
      { id: "obstruction", x: 8, y: 64, color: "red", label: "Obstruction exists", isAllRound: true },
      { id: "obstruction-2", x: 8, y: 74, color: "red", label: "Obstruction exists", isAllRound: true },
      { id: "mh-fore", x: 22, y: 25, color: "white", label: "Masthead (fore)"},
      { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)"},
    ],
    "At anchor": [
      { id: "ar-red1", x: 22, y: 35, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 55, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "ar-white", x: 22, y: 45, color: "white", label: "All-round white (middle)", isAllRound: true },
      { id: "obstruction", x: 8, y: 64, color: "red", label: "Obstruction exists", isAllRound: true },
      { id: "obstruction-2", x: 8, y: 74, color: "red", label: "Obstruction exists", isAllRound: true },
    ],
    default: [
      { id: "ar-red1", x: 22, y: 35, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-white", x: 22, y: 45, color: "white", label: "All-round white (middle)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 55, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "obstruction", x: 8, y: 64, color: "red", label: "Obstruction exists", isAllRound: true },
      { id: "obstruction-2", x: 8, y: 74, color: "red", label: "Obstruction exists", isAllRound: true },
      { id: "mh-fore", x: 22, y: 25, color: "white", label: "Masthead (fore)"},
      { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)"},
    ],
  },
  "ram-mine-clearance": {
    "Underway": [
      { id: "mh-fore", x: 22, y: 25, color: "white", label: "Masthead (fore)"},
      { id: "ar-green1", x: 22, y: 35, color: "green", label: "All-round green", isAllRound: true },
      { id: "ar-green-side-unique", x: 22, y: 45, color: "green", label: "All-round green", isAllRound: true },
      { id: "ar-green-side-unique", x: 22, y: 45, color: "green", label: "All-round green", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)"},
    ],
    "At anchor": [
      { id: "anchor-fore", x: 22, y: 26, color: "white", label: "Anchor (fore)", isAllRound: true },
      { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true },
      { id: "ar-green1", x: 22, y: 35, color: "green", label: "All-round green", isAllRound: true },
      { id: "ar-green-side-unique", x: 22, y: 45, color: "green", label: "All-round green", isAllRound: true },
      { id: "ar-green-side-unique", x: 22, y: 45, color: "green", label: "All-round green", isAllRound: true },
    ],
    default: [
      { id: "mh-fore", x: 22, y: 25, color: "white", label: "Masthead (fore)"},
      { id: "ar-green1", x: 22, y: 35, color: "green", label: "All-round green", isAllRound: true },
      { id: "ar-green-side-unique", x: 22, y: 45, color: "green", label: "All-round green", isAllRound: true },
      { id: "ar-green-side-unique", x: 22, y: 45, color: "green", label: "All-round green", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
      { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)"},
    ],
  },
  cbd: {
    "Under 50m": [
      { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round red", isAllRound: true },
      { id: "ar-red2", x: 20, y: 45, color: "red", label: "All-round red", isAllRound: true },
      { id: "ar-red3", x: 20, y: 55, color: "red", label: "All-round red", isAllRound: true },
      { id: "mh", x: 20, y: 25, color: "white", label: "Masthead" },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
    "Over 50m": [
      { id: "ar-red1", x: 20, y: 35, color: "red", label: "All-round red", isAllRound: true },
      { id: "ar-red2", x: 20, y: 45, color: "red", label: "All-round red", isAllRound: true },
      { id: "ar-red3", x: 20, y: 55, color: "red", label: "All-round red", isAllRound: true },
      { id: "mh", x: 20, y: 25, color: "white", label: "Masthead" },
      { id: "mh-aft", x: 66, y: 15, color: "white", label: "Masthead (aft)"},
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
    default: [
      { id: "ar-red1", x: 20, y: 18, color: "red", label: "All-round red", isAllRound: true },
      { id: "ar-red2", x: 20, y: 30, color: "red", label: "All-round red", isAllRound: true },
      { id: "ar-red3", x: 20, y: 42, color: "red", label: "All-round red", isAllRound: true },
      { id: "mh", x: 66, y: 24, color: "white", label: "Masthead" },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
  },
  anchored: {
    "Under 7m": [],
    "Under 50m": [
      { id: "anchor", x: 22, y: 26, color: "white", label: "Anchor light", isAllRound: true },
    ],
    "Over 50m": [
      { id: "anchor-fore", x: 22, y: 26, color: "white", label: "Anchor (fore)", isAllRound: true },
      { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true },
    ],
    "Over 100m": [
      { id: "anchor-fore", x: 22, y: 26, color: "white", label: "Anchor (fore)", isAllRound: true },
      { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true },
      { id: "anchor-deck", x: 48, y: 60, color: "white", label: "Anchor (deck lights)", isAllRound: true },
    ],
    default: [{ id: "anchor", x: 22, y: 26, color: "white", label: "Anchor light", isAllRound: true }],
  },
  aground: {
    "Under 12m": [],
    "Under 50m": [
      { id: "ar-red1", x: 22, y: 48, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 36, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "anchor", x: 22, y: 24, color: "white", label: "Anchor light", isAllRound: true }, 
    ],
    "Over 50m": [
      { id: "ar-red1", x: 22, y: 48, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 36, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "anchor", x: 22, y: 24, color: "white", label: "Anchor (fore)", isAllRound: true },  
      { id: "anchor-aft", x: 94, y: 64, color: "white", label: "Anchor (aft)", isAllRound: true },  
    ],
    default: [
      { id: "ar-red1", x: 22, y: 24, color: "red", label: "All-round red (upper)", isAllRound: true },
      { id: "ar-red2", x: 22, y: 36, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "anchor", x: 22, y: 48, color: "white", label: "Anchor light", isAllRound: true },
    ],
  },
  towing: {
    "Tow under 200m": [
      { id: "mh1", x: 23, y: 35, color: "white", label: "Masthead (upper)" },
      { id: "mh2", x: 23, y: 45, color: "white", label: "Masthead (lower)" },
      { id: "side-tow", x: 85, y: 70, color: "red", label: "Port sidelight of towed" },
      { id: "side", x: 18, y: 72, color: "red", label: "Port sidelight" },
      { id: "towing", x: 6, y: 62, color: "yellow", label: "Towing light" },
      { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight" },
      { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight of towed" },
    ],
    "Tow over 200m": [
      { id: "mh1", x: 23, y: 25, color: "white", label: "Masthead (upper)" },
      { id: "mh2", x: 23, y: 35, color: "white", label: "Masthead (middle)" },
      { id: "mh3", x: 23, y: 45, color: "white", label: "Masthead (lower)" },
      { id: "side-tow", x: 85, y: 70, color: "red", label: "Port sidelight of towed" },
      { id: "side", x: 18, y: 72, color: "red", label: "Port sidelight" },
      { id: "towing", x: 6, y: 62, color: "yellow", label: "Towing light" },
      { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight" },
      { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight of towed" },
    ],
    "Partly submerged under 200m": [
      { id: "mh1", x: 23, y: 35, color: "white", label: "Masthead (upper)" },
      { id: "mh2", x: 23, y: 45, color: "white", label: "Masthead (lower)" },
      { id: "submerged-fore", x: 63, y: 67, color: "white", label: "Submerged vessel (fore)", isAllRound: true },  
      { id: "submerged-aft", x: 96, y: 67, color: "white", label: "Submerged vessel (aft)", isAllRound: true }, 
      { id: "side", x: 18, y: 72, color: "red", label: "Port sidelight" },
      { id: "towing", x: 6, y: 62, color: "yellow", label: "Towing light" },
      { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight" },
    ],
    "Partly submerged over 200m": [
      { id: "mh1", x: 23, y: 25, color: "white", label: "Masthead (upper)" },
      { id: "mh2", x: 23, y: 35, color: "white", label: "Masthead (middle)" },
      { id: "mh3", x: 23, y: 45, color: "white", label: "Masthead (lower)" },
      { id: "middle-tow", x: 78, y: 67, color: "white", label: "Middle white light of towed vessel (3x)", isAllRound: true },
      { id: "submerged-fore", x: 63, y: 67, color: "white", label: "Submerged vessel (fore)", isAllRound: true },  
      { id: "submerged-aft", x: 96, y: 67, color: "white", label: "Submerged vessel (aft)", isAllRound: true }, 
      { id: "side", x: 18, y: 72, color: "red", label: "Port sidelight" },
      { id: "towing", x: 6, y: 62, color: "yellow", label: "Towing light" },
      { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight" },
    ],
    default: [
      { id: "mh1", x: 23, y: 35, color: "white", label: "Masthead (upper)" },
      { id: "mh2", x: 23, y: 45, color: "white", label: "Masthead (lower)" },
      { id: "side", x: 85, y: 70, color: "red", label: "Port sidelight of towed" },
      { id: "side-tow", x: 18, y: 72, color: "red", label: "Port sidelight" },
      { id: "towing", x: 6, y: 62, color: "yellow", label: "Towing light" },
      { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight" },
      { id: "stern", x: 6, y: 72, color: "white", label: "Sternlight of towed" },
    ],
  },
  pushing: {
    "Single vessel": [
      { id: "mh1", x: 77, y: 35, color: "white", label: "Masthead (upper)" },
      { id: "mh2", x: 77, y: 45, color: "white", label: "Masthead (lower)" },
      { id: "side", x: 70, y: 70, color: "red", label: "Port sidelight" },
      { id: "side-pushed-obj", x: 3, y: 80, color: "red", label: "Port sidelight of pushed vessel" },
      { id: "stern", x: 95, y: 70, color: "white", label: "Sternlight" },
    ],
    "Group of vessels": [
      { id: "mh1", x: 77, y: 35, color: "white", label: "Masthead (upper)" },
      { id: "mh2", x: 77, y: 45, color: "white", label: "Masthead (lower)" },
      { id: "side", x: 70, y: 70, color: "red", label: "Port sidelight" },
      { id: "side-pushed-obj", x: 3, y: 80, color: "red", label: "Port sidelight of pushed vessel" },
      { id: "stern", x: 95, y: 70, color: "white", label: "Sternlight" },
    ],
    "Rigidly connected": [
      { id: "mh1", x: 77, y: 35, color: "white", label: "Masthead" },
      { id: "mh2", x: 10, y: 60, color: "white", label: "Masthead" },
      { id: "side", x: 70, y: 70, color: "red", label: "Port sidelight" },
      { id: "stern", x: 95, y: 70, color: "white", label: "Sternlight" },
    ],
    default: [
      { id: "mh1", x: 77, y: 35, color: "white", label: "Masthead (upper)" },
      { id: "mh2", x: 77, y: 45, color: "white", label: "Masthead (lower)" },
      { id: "side", x: 70, y: 70, color: "red", label: "Port sidelight" },
      { id: "side-pushed-obj", x: 3, y: 80, color: "red", label: "Port sidelight of pushed vessel" },
      { id: "stern", x: 95, y: 70, color: "white", label: "Sternlight" },
    ],
  },
  pilot: {
    "Underway": [
      { id: "ar-white", x: 22, y: 28, color: "white", label: "All-round white (upper)", isAllRound: true },
      { id: "ar-red", x: 22, y: 42, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
    "On anchor": [
      { id: "ar-white", x: 22, y: 28, color: "white", label: "All-round white (upper)", isAllRound: true },
      { id: "ar-red", x: 22, y: 42, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "anchor", x: 55, y: 50, color: "white", label: "Anchor light (under 50m)", isAllRound: true },
    ],
    default: [
      { id: "ar-white", x: 22, y: 28, color: "white", label: "All-round white (upper)", isAllRound: true },
      { id: "ar-red", x: 22, y: 42, color: "red", label: "All-round red (lower)", isAllRound: true },
      { id: "side", x: 8, y: 64, color: "red", label: "Port sidelight" },
      { id: "stern", x: 94, y: 64, color: "white", label: "Sternlight" },
    ],
  },
  seaplane: {
    "A seaplane": [
      { id: "mh", x: 83, y: 33, color: "white", label: "White light" },
      { id: "side", x: 30, y: 50, color: "red", label: "Port sidelight" },
      { id: "stern", x: 85, y: 15, color: "white", label: "Sternlight" },
    ],
    "A WIG craft": [
      { id: "ar-red", x: 50, y: 42, color: "red", label: "All-round blinking red light", isAllRound: true },
      { id: "mh", x: 83, y: 33, color: "white", label: "White light" },
      { id: "side", x: 30, y: 50, color: "red", label: "Port sidelight" },
      { id: "stern", x: 85, y: 32, color: "white", label: "Sternlight" },
    ],
    default: [
      { id: "mh", x: 83, y: 33, color: "white", label: "White light" },
      { id: "side", x: 30, y: 50, color: "red", label: "Port sidelight" },
      { id: "stern", x: 85, y: 15, color: "white", label: "Sternlight" },
    ],
  },
};

/**
 * GRAPHIC COMPONENTS
 */

const CargoSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    <path d={`M ${width * 0.02} ${height * 0.74} L ${width * 0.02} ${height * 0.9} L ${width * 0.98} ${height * 0.9} L ${width * 0.98} ${height * 0.74} Z`} fill="#1e293b" />
    <rect x={width * 0.56} y={height * 0.5} width={width * 0.18} height={height * 0.24} fill="#334155" rx={1} />
    {/* Forward Mast */}
    <rect x={width * 0.2} y={height * 0.3} width={width * 0.012} height={height * 0.44} fill="#1e293b" />
    {/* Rear Mast (Pillar) */}
    <rect x={width * 0.64} y={height * 0.26} width={width * 0.01} height={height * 0.24} fill="#1e293b" />
  </g>
);

const AheadSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    <path d={`M ${width * 0.4} ${height * 0.72} L ${width * 0.6} ${height * 0.72} L ${width * 0.58} ${height * 0.88} L ${width * 0.42} ${height * 0.88} Z`} fill="#1e293b" />
    {/* Central Mast - Adjusted color */}
    <rect x={width * 0.495} y={height * 0.3} width={width * 0.01} height={height * 0.4} fill="#1e293b" />
    <rect x={width * 0.45} y={height * 0.5} width={width * 0.1} height={height * 0.22} fill="#334155" />
  </g>
);

const SternSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    <path d={`M ${width * 0.4} ${height * 0.72} L ${width * 0.6} ${height * 0.72} L ${width * 0.58} ${height * 0.88} L ${width * 0.42} ${height * 0.88} Z`} fill="#1e293b" />
    {/* Central Mast - Adjusted color */}
    <rect x={width * 0.495} y={height * 0.3} width={width * 0.01} height={height * 0.4} fill="#1e293b" />
    <rect x={width * 0.45} y={height * 0.5} width={width * 0.1} height={height * 0.22} fill="#334155" />
  </g>
);

const SailSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    <path d={`M ${width * 0.25} ${height * 0.78} L ${width * 0.3} ${height * 0.9} L ${width * 0.7} ${height * 0.9} L ${width * 0.75} ${height * 0.78} Z`} fill="#1e293b" />
    <rect x={width * 0.42} y={height * 0.3} width={width * 0.012} height={height * 0.48} fill="#1e293b" />
    <path d={`M ${width * 0.43} ${height * 0.32} L ${width * 0.43} ${height * 0.74} L ${width * 0.6} ${height * 0.74} Z`} fill="#334155" opacity="0.4" />
  </g>
);

const SailAheadSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    <path d={`M ${width * 0.42} ${height * 0.75} L ${width * 0.58} ${height * 0.75} L ${width * 0.5} ${height * 0.9} Z`} fill="#1e293b" />
    {/* Central Mast */}
    <rect x={width * 0.495} y={height * 0.2} width={width * 0.01} height={height * 0.7} fill="#1e293b" />
  </g>
);

const SailSternSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    <path d={`M ${width * 0.4} ${height * 0.72} L ${width * 0.6} ${height * 0.72} L ${width * 0.55} ${height * 0.88} L ${width * 0.45} ${height * 0.88} Z`} fill="#1e293b" />
    {/* Central Mast */}
    <rect x={width * 0.495} y={height * 0.3} width={width * 0.01} height={height * 0.5} fill="#1e293b" />
  </g>
);

const SeaplaneSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    {/* Float (Pontoon) */}
    <path d={`M ${width * 0.2} ${height * 0.82} L ${width * 0.8} ${height * 0.82} L ${width * 0.75} ${height * 0.92} L ${width * 0.25} ${height * 0.9} Z`} fill="#1e293b" />
    
    {/* Struts connecting float to body */}
    <path d={`M ${width * 0.35} ${height * 0.82} L ${width * 0.4} ${height * 0.65} L ${width * 0.42} ${height * 0.65} L ${width * 0.37} ${height * 0.82} Z`} fill="#1e293b" />
    <path d={`M ${width * 0.6} ${height * 0.82} L ${width * 0.55} ${height * 0.65} L ${width * 0.57} ${height * 0.65} L ${width * 0.62} ${height * 0.82} Z`} fill="#1e293b" />

    {/* Fuselage (Body) */}
    <path d={`M ${width * 0.15} ${height * 0.55} Q ${width * 0.5} ${height * 0.45} ${width * 0.9} ${height * 0.4} L ${width * 0.92} ${height * 0.25} L ${width * 0.8} ${height * 0.42} L ${width * 0.15} ${height * 0.65} Z`} fill="#334155" />
    
    {/* Wing (Side Profile) */}
    <path d={`M ${width * 0.3} ${height * 0.5} L ${width * 0.6} ${height * 0.48} L ${width * 0.6} ${height * 0.52} L ${width * 0.3} ${height * 0.54} Z`} fill="#1e293b" />
    
    {/* Propeller/Nose */}
    <rect x={width * 0.12} y={height * 0.52} width={width * 0.04} height={height * 0.15} fill="#1e293b" rx={2} />
  </g>
);

const SeaplaneAheadSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    {/* Main Wing */}
    <rect x={width * 0.1} y={height * 0.35} width={width * 0.8} height={height * 0.06} fill="#1e293b" rx={2} />
    
    {/* Fuselage Center */}
    <rect x={width * 0.45} y={height * 0.4} width={width * 0.1} height={height * 0.25} fill="#334155" rx={5} />
    
    {/* Floats (Pontoons) */}
    <rect x={width * 0.25} y={height * 0.75} width={width * 0.12} height={height * 0.15} fill="#1e293b" rx={3} />
    <rect x={width * 0.63} y={height * 0.75} width={width * 0.12} height={height * 0.15} fill="#1e293b" rx={3} />
    
    {/* Struts */}
    <path d={`M ${width * 0.31} ${height * 0.75} L ${width * 0.45} ${height * 0.45} L ${width * 0.46} ${height * 0.45} L ${width * 0.32} ${height * 0.75} Z`} fill="#1e293b" opacity="0.8" />
    <path d={`M ${width * 0.69} ${height * 0.75} L ${width * 0.55} ${height * 0.45} L ${width * 0.54} ${height * 0.45} L ${width * 0.68} ${height * 0.75} Z`} fill="#1e293b" opacity="0.8" />
    
    {/* Propeller Arc (Hint) */}
    <circle cx={width * 0.5} cy={height * 0.42} r={width * 0.03} fill="#1e293b" />
  </g>
);

const SeaplaneSternSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    {/* Main Wing */}
    <rect x={width * 0.1} y={height * 0.35} width={width * 0.8} height={height * 0.06} fill="#1e293b" rx={2} />
    
    {/* Horizontal Stabilizer (Tail wing) - sits higher/further back */}
    <rect x={width * 0.35} y={height * 0.22} width={width * 0.3} height={height * 0.04} fill="#1e293b" rx={1} />
    
    {/* Vertical Stabilizer (Tail fin) */}
    <rect x={width * 0.48} y={height * 0.15} width={width * 0.04} height={height * 0.25} fill="#334155" />
    
    {/* Fuselage Center */}
    <rect x={width * 0.46} y={height * 0.4} width={width * 0.08} height={height * 0.2} fill="#334155" rx={5} />
    
    {/* Floats (Pontoons) - Slightly narrower from back */}
    <rect x={width * 0.26} y={height * 0.75} width={width * 0.1} height={height * 0.15} fill="#1e293b" rx={3} />
    <rect x={width * 0.64} y={height * 0.75} width={width * 0.1} height={height * 0.15} fill="#1e293b" rx={3} />
    
    {/* Struts */}
    <path d={`M ${width * 0.31} ${height * 0.75} L ${width * 0.46} ${height * 0.42} Z`} stroke="#1e293b" strokeWidth={2} />
    <path d={`M ${width * 0.69} ${height * 0.75} L ${width * 0.54} ${height * 0.42} Z`} stroke="#1e293b" strokeWidth={2} />
  </g>
);

const PushingSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    {/* Barge (Front/Left) - Pushed unit leading left */}
    <path d={`M ${width * 0.02} ${height * 0.76} L ${width * 0.05} ${height * 0.88} L ${width * 0.6} ${height * 0.88} L ${width * 0.6} ${height * 0.76} Z`} fill="#1e293b" />
    <rect x={width * 0.05} y={height * 0.72} width={width * 0.5} height={height * 0.08} fill="#334155" opacity="0.8" rx={1} />

    {/* Tug (Rear/Right) - Pushing from behind */}
    <path d={`M ${width * 0.62} ${height * 0.72} L ${width * 0.62} ${height * 0.88} L ${width * 0.95} ${height * 0.88} L ${width * 0.95} ${height * 0.72} Z`} fill="#1e293b" />
    <rect x={width * 0.70} y={height * 0.55} width={width * 0.15} height={height * 0.18} fill="#334155" rx={2} />
    {/* Tug Mast */}
    <rect x={width * 0.765} y={height * 0.4} width={width * 0.015} height={height * 0.32} fill="#1e293b" />
  </g>
);

const PushingAheadSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    {/* Wide Barge Front */}
    <path d={`M ${width * 0.2} ${height * 0.75} L ${width * 0.8} ${height * 0.75} L ${width * 0.75} ${height * 0.9} L ${width * 0.25} ${height * 0.9} Z`} fill="#1e293b" />
    <rect x={width * 0.25} y={height * 0.65} width={width * 0.5} height={height * 0.1} fill="#334155" opacity="0.6" />
    
    {/* Tug Wheelhouse visible above barge */}
    <rect x={width * 0.42} y={height * 0.45} width={width * 0.16} height={height * 0.2} fill="#334155" rx={2} />
    <rect x={width * 0.495} y={height * 0.3} width={width * 0.01} height={height * 0.35} fill="#1e293b" />
  </g>
);

const PushingSternSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    {/* Tug Rear (Prominent) */}
    <path d={`M ${width * 0.35} ${height * 0.75} L ${width * 0.65} ${height * 0.75} L ${width * 0.6} ${height * 0.9} L ${width * 0.4} ${height * 0.9} Z`} fill="#1e293b" />
    <rect x={width * 0.42} y={height * 0.55} width={width * 0.16} height={height * 0.2} fill="#334155" rx={2} />
    
    {/* Barge visible slightly on sides if wide */}
    <path d={`M ${width * 0.2} ${height * 0.8} L ${width * 0.34} ${height * 0.8} L ${width * 0.34} ${height * 0.85} L ${width * 0.25} ${height * 0.85} Z`} fill="#1e293b" opacity="0.6" />
    <path d={`M ${width * 0.66} ${height * 0.8} L ${width * 0.8} ${height * 0.8} L ${width * 0.75} ${height * 0.85} L ${width * 0.66} ${height * 0.85} Z`} fill="#1e293b" opacity="0.6" />

    {/* Mast */}
    <rect x={width * 0.495} y={height * 0.35} width={width * 0.01} height={height * 0.4} fill="#1e293b" />
  </g>
);

const TowingSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    {/* Tug (Left/Front) - Leading left */}
    <path d={`M ${width * 0.05} ${height * 0.75} L ${width * 0.1} ${height * 0.9} L ${width * 0.38} ${height * 0.9} L ${width * 0.38} ${height * 0.75} Z`} fill="#1e293b" />
    <rect x={width * 0.18} y={height * 0.6} width={width * 0.12} height={height * 0.15} fill="#334155" rx={2} />
    <rect x={width * 0.23} y={height * 0.45} width={width * 0.01} height={height * 0.3} fill="#1e293b" />

    {/* Tow Line */}
    <line x1={width * 0.38} y1={height * 0.8} x2={width * 0.62} y2={height * 0.75} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 2" />

    {/* Towed Vessel (Right/Rear) - Following */}
    <path d={`M ${width * 0.62} ${height * 0.7} L ${width * 0.65} ${height * 0.88} L ${width * 0.98} ${height * 0.88} L ${width * 0.98} ${height * 0.7} Z`} fill="#1e293b" />
    <rect x={width * 0.85} y={height * 0.55} width={width * 0.1} height={height * 0.15} fill="#334155" />
    <rect x={width * 0.89} y={height * 0.35} width={width * 0.01} height={height * 0.35} fill="#1e293b" />
  </g>
);

const TowingAheadSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    {/* Tug (Front/Prominent) */}
    <path d={`M ${width * 0.35} ${height * 0.75} L ${width * 0.65} ${height * 0.75} L ${width * 0.6} ${height * 0.9} L ${width * 0.4} ${height * 0.9} Z`} fill="#1e293b" />
    <rect x={width * 0.42} y={height * 0.55} width={width * 0.16} height={height * 0.2} fill="#334155" rx={2} />
    <rect x={width * 0.495} y={height * 0.35} width={width * 0.01} height={height * 0.4} fill="#1e293b" />

    {/* Towed Vessel (Behind/Obscured but visible on sides) */}
    <path d={`M ${width * 0.2} ${height * 0.65} L ${width * 0.3} ${height * 0.65} L ${width * 0.3} ${height * 0.8} L ${width * 0.25} ${height * 0.8} Z`} fill="#1e293b" opacity="0.5" />
    <path d={`M ${width * 0.7} ${height * 0.65} L ${width * 0.8} ${height * 0.65} L ${width * 0.75} ${height * 0.8} L ${width * 0.7} ${height * 0.8} Z`} fill="#1e293b" opacity="0.5" />
  </g>
);

const TowingSternSilhouette = ({ width, height }: { width: number; height: number }) => (
  <g>
    {/* Towed Vessel (Front/Prominent in stern view) */}
    <path d={`M ${width * 0.3} ${height * 0.7} L ${width * 0.7} ${height * 0.7} L ${width * 0.65} ${height * 0.9} L ${width * 0.35} ${height * 0.9} Z`} fill="#1e293b" />
    <rect x={width * 0.4} y={height * 0.5} width={width * 0.2} height={height * 0.2} fill="#334155" />
    <rect x={width * 0.495} y={height * 0.3} width={width * 0.01} height={height * 0.4} fill="#1e293b" />
  </g>
);

function Light({ config, width, height, animated, index, onHover }: { 
  config: LightConfig; width: number; height: number; animated: boolean; index: number; 
  onHover: (light: LightConfig | null) => void 
}) {
  const colors = LIGHT_COLORS[config.color];
  const x = (config.x / 100) * width;
  const y = (config.y / 100) * height;
  const radius = Math.min(width, height) * 0.032;

  return (
    <motion.g
      initial={animated ? { opacity: 0, scale: 0 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ delay: 0.1 + index * 0.05 }}
      onMouseEnter={() => onHover(config)}
      onMouseLeave={() => onHover(null)}
    >
      <circle cx={x} cy={y} r={radius * 6} fill="transparent" style={{ cursor: "pointer", pointerEvents: "all" }} />
      <circle cx={x} cy={y} r={radius * 4} fill={colors.fill} opacity={0.15} style={{ pointerEvents: "none" }} />
      <circle cx={x} cy={y} r={radius} fill={colors.fill} style={{ pointerEvents: "none", filter: `drop-shadow(0 0 6px ${colors.glow})` }} />
    </motion.g>
  );
}

/**
 * MAIN COMPONENT
 */

export default function VesselLights({ 
  type = "power-driven", 
  length: initialLength,
  size = "md", 
  animated = true,
  showLabels = true
}: VesselLightsProps) {
  const [view, setView] = useState<ViewAngle>("port");
  const [hoveredLights, setHoveredLights] = useState<LightConfig[]>([]);
  const { width, height } = SIZE_CONFIG[size];

  const typeConfig = VESSEL_LIGHT_CONFIGS[type] || VESSEL_LIGHT_CONFIGS["power-driven"];
  const availableLengths = Object.keys(typeConfig).filter(k => k !== "default");

  // Set default length if not provided
  const [lengthState, setLengthState] = useState<LengthCategory>(() => {
    if (initialLength) return initialLength;
    if (availableLengths.includes("over50m")) return "over50m";
    if (availableLengths.length > 0) return availableLengths[0] as LengthCategory;
    return "under50m"; // Fallback
  });

  const visibleLights = useMemo(() => {
    const baseLights = typeConfig[lengthState] || typeConfig["default"];

    return baseLights.filter((l: LightConfig) => {
      if (l.isAllRound) return true;
      // Towing light is a sector light, only visible from stern
      if (l.id.includes("towing") && view !== "stern") return false;
      
      if (view === "ahead") return !l.id.includes("stern") && !l.id.includes("towing");
      if (view === "stern") return l.id.includes("stern") || l.id.includes("towing");
      // Profile view: hide stern/towing
      return !l.id.includes("stern") && !l.id.includes("towing");
    }).flatMap((l: LightConfig) => {
      let xPos = l.x;
      let color = l.color;
      let label = l.label;

      if (view === "ahead") {
        
        
        if (l.id.includes("green-side-unique")) {
          // Perspective swap: Starboard (Green) on left, Port (Red) on right
          return [
            { ...l, id: "stbd-side", x: 45, color: "green" as const, label: "Starboard sidelight" },
            { ...l, id: "port-side", x: 55, color: "green" as const, label: "Port sidelight" }
          ];
        } else if (l.id.includes("side-tow")) {
          // Perspective swap: Starboard (Green) on left, Port (Red) on right
          return [
            { ...l, id: "stbd-side", x: 22, color: "green" as const, label: "Starboard sidelight of towed vessel" },
            { ...l, id: "port-side", x: 78, color: "red" as const, label: "Port sidelight of towed vessel" }
          ];
        } else if (l.id.includes("side-pushed-obj")) {
          // Perspective swap: Starboard (Green) on left, Port (Red) on right
          return [
            { ...l, id: "stbd-side", x: 20, color: "green" as const, label: "Starboard side of pushed vessel" },
            { ...l, id: "port-side", x: 80, color: "red" as const, label: "Port side of pushed vessel" }
          ];
        } else if (l.id.includes("side")) {
          // Perspective swap: Starboard (Green) on left, Port (Red) on right
          return [
            { ...l, id: "stbd-side", x: 42, color: "green" as const, label: "Starboard sidelight" },
            { ...l, id: "port-side", x: 58, color: "red" as const, label: "Port sidelight" }
          ];
        } else if (l.id.includes("obstruction")) {
          // Perspective swap: Starboard (Green) on left, Port (Red) on right
          return [
            { ...l, id: "stbd-side", x: 45, color: "green" as const, label: "Vessel may pass" },
            { ...l, id: "port-side", x: 55, color: "red" as const, label: "Obstruction exists" }
          ];
        } else if (l.id.includes("middle-tow")) {
          return [
            { ...l, id: "stbd-tow-side", x: 45, color: "white" as const, label: "Middle towing light (starboard)" },
            { ...l, id: "middle-tow-side", x: 50, color: "white" as const, label: "Middle towing light (middle)" },
            { ...l, id: "port-tow-side", x: 55, color: "white" as const, label: "Middle towing light (port)" }
          ];
        }
        xPos = 50; 
        

      } else if (view === "stern" && l.isAllRound) {
        if (l.id.includes("obstruction")) {
          // Perspective swap: Starboard (Green) on left, Port (Red) on right
          return [
            { ...l, id: "stbd-side", x: 55, color: "green" as const, label: "Vessel may pass" },
            { ...l, id: "port-side", x: 45, color: "red" as const, label: "Obstruction exists" }
          ];
        } else if (l.id.includes("green-side-unique")) {
          // Perspective swap: Starboard (Green) on left, Port (Red) on right
          return [
            { ...l, id: "stbd-side", x: 45, color: "green" as const, label: "Starboard sidelight" },
            { ...l, id: "port-side", x: 55, color: "green" as const, label: "Port sidelight" }
          ];
        }  else if (l.id.includes("middle-tow")) {
          return [
            { ...l, id: "port-tow-side", x: 45, color: "white" as const, label: "Middle towing light (port)" },
            { ...l, id: "middle-tow-side", x: 50, color: "white" as const, label: "Middle towing light (middle)" },
            { ...l, id: "stbd-tow-side", x: 55, color: "white" as const, label: "Middle towing light (starboard)" }
          ];
        }
        xPos = 50; 
      } else if (view === "stern") {
        xPos = 50;
      }else if (view === "starboard") {
        xPos = 100 - l.x; // Flip X position for mirrored view
        if (l.id.includes("side")) {
          color = "green";
          label = label.replace("Port", "Starboard");
        }
        if (l.id.includes("obstruction")) {
          color = "green";
          label = label.replace("Obstruction exists", "Vessel may pass");
        }
      }

      return [{ ...l, x: xPos, color, label }];
    });
  }, [type, lengthState, view, typeConfig]);

  const handleHover = (light: LightConfig | null) => {
    if (!light) return setHoveredLights([]);
    const clustered = visibleLights.filter((l: LightConfig) => 
      Math.abs(l.x - light.x) < 5 && Math.abs(l.y - light.y) < 15
    );
    setHoveredLights(clustered);
  };

return (
    <div className="inline-flex flex-col items-center gap-3 relative">
      <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <rect width={width} height={height} fill="#0f172a" />
          
          <g style={{ transform: view === "starboard" ? "scaleX(-1)" : undefined, transformOrigin: "center" }}>
            {view === "ahead" ? (
              // AHEAD VIEW
              type === "sailing" ? (
                <SailAheadSilhouette width={width} height={height} />
              ) : type === "seaplane" ? (
                <SeaplaneAheadSilhouette width={width} height={height} />
              ) : type === "pushing" ? (
                <PushingAheadSilhouette width={width} height={height} />
              ) : type === "towing" ? (
                <TowingAheadSilhouette width={width} height={height} />
              ) : (
                <AheadSilhouette width={width} height={height} />
              )
            ) : view === "stern" ? (
              // STERN VIEW
              type === "sailing" ? (
                <SailSternSilhouette width={width} height={height} />
              ) : type === "seaplane" ? (
                <SeaplaneSternSilhouette width={width} height={height} />
              ) : type === "pushing" ? (
                <PushingSternSilhouette width={width} height={height} />
              ) : type === "towing" ? (
                <TowingSternSilhouette width={width} height={height} />
              ) : (
                <SternSilhouette width={width} height={height} />
              )
            ) : (
              // SIDE VIEW (Port/Starboard)
              type === "sailing" ? (
                <SailSilhouette width={width} height={height} />
              ) : type === "seaplane" ? (
                <SeaplaneSilhouette width={width} height={height} />
              ) : type === "pushing" ? (
                <PushingSilhouette width={width} height={height} />
              ) : type === "towing" ? (
                <TowingSilhouette width={width} height={height} />
              ) : (
                <CargoSilhouette width={width} height={height} />
              )
            )}
          </g>

          {visibleLights.map((l, i) => (
            <Light key={`${l.id}-${view}-${i}`} config={l} width={width} height={height} animated={animated} index={i} onHover={handleHover} />
          ))}
        </svg>

        <AnimatePresence>
          {hoveredLights.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-800/90 border border-slate-700 px-2 py-1 rounded text-[10px] backdrop-blur-sm z-50 pointer-events-none"
            >
              {hoveredLights.map(l => (
                <div key={l.id} className="flex items-center gap-2 text-slate-100 py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: LIGHT_COLORS[l.color].fill }} />
                  <span className="font-medium whitespace-nowrap">{l.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Buttons - Small font style */}
      <div className="flex gap-2">
        {(["ahead", "port", "starboard", "stern"] as ViewAngle[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              view === v ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700"
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Length Toggle */}
      {availableLengths.length > 0 && (
        <div className="flex gap-2">
          {availableLengths.map((len) => (
            <button
              key={len}
              onClick={() => setLengthState(len as LengthCategory)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                lengthState === len ? "bg-slate-700 text-slate-200 border border-slate-500" : "bg-slate-800/50 text-slate-500 border border-transparent hover:bg-slate-700"
              }`}
            >
              {len.replace("under", "< ").replace("over", "> ")}
            </button>
          ))}
        </div>
      )}

      {showLabels && visibleLights.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center max-w-[340px] text-[10px]">
          {visibleLights.map((l, i) => (
            <div key={`${l.id}-label-${i}`} className="flex items-center gap-1 text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: LIGHT_COLORS[l.color].fill }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}