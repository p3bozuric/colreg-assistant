"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LightColor = "white" | "red" | "green" | "yellow" | "blue";

interface Light {
  type: string;
  arc: number; // degrees
  color: LightColor;
  startAngle?: number; // degrees from bow (0 = dead ahead)
  range?: number; // visibility in nautical miles
  purpose?: string; // description of the light's purpose
  position?: "center" | "port" | "starboard" | "stern"; // where the light originates from
}

interface LightArcsProps {
  lights: Light[];
  size?: number;
  showVessel?: boolean;
  animated?: boolean;
  vesselType?: "power" | "sail"; // sailboats have lights from center
  configKey?: string; // optional config key to enable size toggle
}

const LIGHT_COLORS: Record<LightColor, { fill: string; stroke: string; glow: string }> = {
  white: {
    fill: "rgba(255, 255, 255, 0.12)",
    stroke: "rgba(255, 255, 255, 0.9)",
    glow: "rgba(255, 255, 255, 0.4)",
  },
  red: {
    fill: "rgba(239, 68, 68, 0.15)",
    stroke: "rgba(239, 68, 68, 0.95)",
    glow: "rgba(239, 68, 68, 0.4)",
  },
  green: {
    fill: "rgba(34, 197, 94, 0.15)",
    stroke: "rgba(34, 197, 94, 0.95)",
    glow: "rgba(34, 197, 94, 0.4)",
  },
  yellow: {
    fill: "rgba(234, 179, 8, 0.15)",
    stroke: "rgba(234, 179, 8, 0.95)",
    glow: "rgba(234, 179, 8, 0.4)",
  },
  blue: {
    fill: "rgba(59, 130, 246, 0.15)",
    stroke: "rgba(59, 130, 246, 0.95)",
    glow: "rgba(59, 130, 246, 0.4)",
  },
};

// Standard light configurations
const STANDARD_LIGHTS: Record<string, { arc: number; startAngle: number; range: number; position?: "center" | "port" | "starboard" | "stern" }> = {
  masthead: { arc: 225, startAngle: -112.5, range: 6, position: "center" },
  "masthead-aft": { arc: 225, startAngle: -112.5, range: 6, position: "center" },
  "sidelight-port": { arc: 112.5, startAngle: -112.5, range: 3, position: "port" },
  "sidelight-starboard": { arc: 112.5, startAngle: 0, range: 3, position: "starboard" },
  sternlight: { arc: 135, startAngle: 112.5, range: 3, position: "stern" },
  "all-round": { arc: 360, startAngle: 0, range: 3, position: "center" },
  "all-round-upper": { arc: 360, startAngle: 0, range: 3, position: "center" },
  "all-round-middle": { arc: 360, startAngle: 0, range: 3, position: "center" },
  "all-round-lower": { arc: 360, startAngle: 0, range: 3, position: "center" },
  towing: { arc: 135, startAngle: 112.5, range: 3, position: "stern" },
  anchor: { arc: 360, startAngle: 0, range: 3, position: "center" },
};

// Convert range to visual radius (scaled for visual distinction)
function rangeToRadius(range: number, baseRadius: number): number {
  if (range >= 6) return baseRadius;
  if (range >= 3) return baseRadius * 0.75;
  return baseRadius * 0.55;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", x, y,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z",
  ].join(" ");
}

// Get the origin point for a light based on its position
function getLightOrigin(
  center: number,
  vesselWidth: number,
  vesselLength: number,
  position: "center" | "port" | "starboard" | "stern",
  isSailboat: boolean
): { x: number; y: number } {
  // Sailboats have all lights from center
  if (isSailboat) {
    return { x: center, y: center };
  }

  // Offset sidelights to vessel edges
  const sideOffset = vesselWidth * 0.5;
  // Offset stern light to back of vessel
  const sternOffset = vesselLength * 0.35;

  switch (position) {
    case "port":
      return { x: center - sideOffset, y: center };
    case "starboard":
      return { x: center + sideOffset, y: center };
    case "stern":
      return { x: center, y: center + sternOffset };
    default:
      return { x: center, y: center };
  }
}

function LightArc({
  light,
  center,
  baseRadius,
  vesselWidth,
  vesselLength,
  animated,
  index,
  isHovered,
  isSailboat,
}: {
  light: Light;
  center: number;
  baseRadius: number;
  vesselWidth: number;
  vesselLength: number;
  animated: boolean;
  index: number;
  isHovered: boolean;
  isSailboat: boolean;
}) {
  const standardConfig = STANDARD_LIGHTS[light.type] || STANDARD_LIGHTS["all-round"];
  const arc = light.arc;
  const startAngle = light.startAngle ?? standardConfig?.startAngle ?? 0;
  const endAngle = startAngle + arc;
  const range = light.range ?? standardConfig?.range ?? 3;
  const position = light.position ?? standardConfig?.position ?? "center";
  const colors = LIGHT_COLORS[light.color];

  // Calculate radius based on range
  const radius = rangeToRadius(range, baseRadius);

  // Get origin point based on light position
  const origin = getLightOrigin(center, vesselWidth, vesselLength, position, isSailboat);

  // For 360° lights, draw a circle
  const isAllRound = arc >= 360;

  const pathD = isAllRound
    ? `M ${origin.x} ${origin.y - radius} A ${radius} ${radius} 0 1 1 ${origin.x} ${origin.y + radius} A ${radius} ${radius} 0 1 1 ${origin.x} ${origin.y - radius}`
    : describeArc(origin.x, origin.y, radius, startAngle, endAngle);

  return (
    <motion.g
      initial={animated ? { opacity: 0, scale: 0.9 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ delay: index * 0.08, duration: 0.25 }}
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <filter id={`glow-${light.type}-${index}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main light arc/circle with subtle fill */}
      <path
        d={pathD}
        fill={isHovered ? colors.fill.replace("0.12", "0.25").replace("0.15", "0.3") : colors.fill}
        stroke={colors.stroke}
        strokeWidth={isHovered ? 2.5 : 1.5}
        filter={`url(#glow-${light.type}-${index})`}
      />

      {/* Boundary lines for non-360° arcs */}
      {!isAllRound && (
        <>
          <line
            x1={origin.x}
            y1={origin.y}
            x2={polarToCartesian(origin.x, origin.y, radius, startAngle).x}
            y2={polarToCartesian(origin.x, origin.y, radius, startAngle).y}
            stroke={colors.stroke}
            strokeWidth={1.5}
          />
          <line
            x1={origin.x}
            y1={origin.y}
            x2={polarToCartesian(origin.x, origin.y, radius, endAngle).x}
            y2={polarToCartesian(origin.x, origin.y, radius, endAngle).y}
            stroke={colors.stroke}
            strokeWidth={1.5}
          />
        </>
      )}

    </motion.g>
  );
}

// Ship silhouette component (top view)
function VesselSilhouette({
  center,
  size,
  animated,
  isSailboat,
}: {
  center: number;
  size: number;
  animated: boolean;
  isSailboat: boolean;
}) {
  const width = size * 0.12;
  const length = size * 0.22;

  if (isSailboat) {
    // Sailboat silhouette - narrower, with mast indication
    return (
      <motion.g
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <path
          d={`
            M ${center} ${center - length * 0.7}
            L ${center + width * 0.35} ${center + length * 0.1}
            Q ${center + width * 0.35} ${center + length * 0.4} ${center} ${center + length * 0.45}
            Q ${center - width * 0.35} ${center + length * 0.4} ${center - width * 0.35} ${center + length * 0.1}
            Z
          `}
          fill="rgba(100, 116, 139, 0.95)"
          stroke="rgba(148, 163, 184, 0.8)"
          strokeWidth={1.5}
        />
        {/* Mast */}
        <circle
          cx={center}
          cy={center - length * 0.1}
          r={3}
          fill="rgba(71, 85, 105, 0.9)"
          stroke="rgba(148, 163, 184, 0.6)"
          strokeWidth={1}
        />
      </motion.g>
    );
  }

  return (
    <motion.g
      initial={animated ? { opacity: 0 } : undefined}
      animate={animated ? { opacity: 1 } : undefined}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      {/* Ship hull - pointed bow, rounded stern */}
      <path
        d={`
          M ${center} ${center - length * 0.6}
          L ${center + width * 0.5} ${center - length * 0.1}
          L ${center + width * 0.5} ${center + length * 0.3}
          Q ${center + width * 0.5} ${center + length * 0.5} ${center} ${center + length * 0.5}
          Q ${center - width * 0.5} ${center + length * 0.5} ${center - width * 0.5} ${center + length * 0.3}
          L ${center - width * 0.5} ${center - length * 0.1}
          Z
        `}
        fill="rgba(100, 116, 139, 0.95)"
        stroke="rgba(148, 163, 184, 0.8)"
        strokeWidth={1.5}
      />
      {/* Bridge/superstructure */}
      <rect
        x={center - width * 0.35}
        y={center - length * 0.05}
        width={width * 0.7}
        height={length * 0.25}
        rx={2}
        fill="rgba(71, 85, 105, 0.9)"
        stroke="rgba(148, 163, 184, 0.6)"
        strokeWidth={1}
      />
      {/* Bow indicator dot */}
      <circle
        cx={center}
        cy={center - length * 0.45}
        r={2}
        fill="rgba(255, 255, 255, 0.9)"
      />
    </motion.g>
  );
}

// Format light type for display (full names)
function formatLightType(type: string): string {
  return type
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Check if a point is inside a light arc
function isPointInArc(
  px: number,
  py: number,
  origin: { x: number; y: number },
  radius: number,
  startAngle: number,
  arcDegrees: number
): boolean {
  const dx = px - origin.x;
  const dy = py - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Check if within radius
  if (distance > radius) return false;

  // For 360° lights, just check radius
  if (arcDegrees >= 360) return true;

  // Calculate angle from origin to point (in navigational degrees: 0 = up, clockwise)
  let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  // Normalize start angle to 0-360
  let start = startAngle;
  while (start < 0) start += 360;
  start = start % 360;

  const end = (start + arcDegrees) % 360;

  // Check if angle is within arc
  if (start <= end) {
    return angle >= start && angle <= end;
  } else {
    // Arc wraps around 360°
    return angle >= start || angle <= end;
  }
}

// Length group definitions for size toggle
const LENGTH_GROUPS: Record<string, { configs: string[]; labels: string[] }> = {
  "power-driven": {
    configs: ["power-driven-underway", "power-driven-over-50m"],
    labels: ["Under 50m", "50m and over"],
  },
  "sailing": {
    configs: ["sailing-under-20m", "sailing-underway", "sailing-optional"],
    labels: ["Under 20m", "20m and over", "With optional"],
  },
};

export default function LightArcs({
  lights: initialLights,
  size = 220,
  showVessel = true,
  animated = true,
  vesselType: initialVesselType = "power",
  configKey,
}: LightArcsProps) {
  const [hoveredLights, setHoveredLights] = useState<Light[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string | undefined>(configKey);
  const svgRef = useRef<SVGSVGElement>(null);
  const center = size / 2;
  const baseRadius = size * 0.42;
  const vesselWidth = size * 0.12;
  const vesselLength = size * 0.22;

  // Determine if we have size toggle options
  const currentConfig = selectedConfig ? VESSEL_LIGHT_CONFIGS[selectedConfig] : null;
  const lengthGroup = currentConfig?.lengthGroup;
  const groupInfo = lengthGroup ? LENGTH_GROUPS[lengthGroup] : null;
  const hasMultipleSizes = groupInfo && groupInfo.configs.length > 1;

  // Use config lights if available, otherwise use passed lights
  const lights = currentConfig?.lights || initialLights;
  const vesselType = currentConfig?.vesselType || initialVesselType;
  const isSailboat = vesselType === "sail";

  // Calculate which lights contain the mouse position
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * size;
      const y = ((e.clientY - rect.top) / rect.height) * size;

      const matchingLights: Light[] = [];

      for (const light of lights) {
        const standardConfig = STANDARD_LIGHTS[light.type] || STANDARD_LIGHTS["all-round"];
        const range = light.range ?? standardConfig?.range ?? 3;
        const radius = rangeToRadius(range, baseRadius);
        const position = light.position ?? standardConfig?.position ?? "center";
        const origin = getLightOrigin(center, vesselWidth, vesselLength, position, isSailboat);
        const startAngle = light.startAngle ?? standardConfig?.startAngle ?? 0;

        if (isPointInArc(x, y, origin, radius, startAngle, light.arc)) {
          matchingLights.push(light);
        }
      }

      setHoveredLights(matchingLights);
    },
    [lights, size, baseRadius, center, vesselWidth, vesselLength, isSailboat]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredLights([]);
  }, []);

  return (
    <div className="inline-flex flex-col items-center gap-2 relative">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rounded-lg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Light arcs - render in order of range (largest first for proper layering) */}
        {[...lights]
          .sort((a, b) => {
            const rangeA = a.range ?? STANDARD_LIGHTS[a.type]?.range ?? 3;
            const rangeB = b.range ?? STANDARD_LIGHTS[b.type]?.range ?? 3;
            return rangeB - rangeA;
          })
          .map((light, idx) => (
            <LightArc
              key={`${light.type}-${idx}`}
              light={light}
              center={center}
              baseRadius={baseRadius}
              vesselWidth={vesselWidth}
              vesselLength={vesselLength}
              animated={animated}
              index={idx}
              isHovered={hoveredLights.some((l) => l.type === light.type)}
              isSailboat={isSailboat}
            />
          ))}

        {/* Vessel silhouette */}
        {showVessel && (
          <VesselSilhouette center={center} size={size} animated={animated} isSailboat={isSailboat} />
        )}
      </svg>

      {/* Size toggle (only show if multiple size configs exist) */}
      {hasMultipleSizes && groupInfo && (
        <div className="flex items-center gap-2">
          {groupInfo.configs.map((cfg, idx) => (
            <button
              key={cfg}
              onClick={() => setSelectedConfig(cfg)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedConfig === cfg
                  ? "bg-slate-500/30 text-slate-200 border border-slate-400/50"
                  : "bg-muted/10 text-muted hover:bg-muted/20 border border-transparent"
              }`}
            >
              {groupInfo.labels[idx]}
            </button>
          ))}
        </div>
      )}

      {/* Hover tooltip - shows all lights at cursor position */}
      <AnimatePresence>
        {hoveredLights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-lg bg-card-bg border border-border shadow-xl backdrop-blur-md text-xs"
          >
            <div className="flex gap-4">
              {hoveredLights.map((light) => (
                <div key={light.type} className="flex flex-col gap-1">
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: LIGHT_COLORS[light.color].stroke }}
                    />
                    {formatLightType(light.type)}
                  </div>
                  <div className="text-muted text-[10px] space-y-0.5">
                    <div>{light.arc}° arc</div>
                    <div>{light.range ?? STANDARD_LIGHTS[light.type]?.range ?? 3} NM</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Pre-defined light configurations for common vessel types
export const VESSEL_LIGHT_CONFIGS: Record<string, { lights: Light[]; vesselType?: "power" | "sail"; title: string; lengthGroup?: string }> = {
  "power-driven-underway": {
    title: "Power-Driven Vessel <50m",
    lengthGroup: "power-driven",
    lights: [
      { type: "masthead", arc: 225, color: "white", startAngle: -112.5, range: 6, position: "center", purpose: "Forward masthead light showing vessel is power-driven and underway" },
      { type: "sidelight-port", arc: 112.5, color: "red", startAngle: -112.5, range: 3, position: "port", purpose: "Port sidelight visible to vessels on port side" },
      { type: "sidelight-starboard", arc: 112.5, color: "green", startAngle: 0, range: 3, position: "starboard", purpose: "Starboard sidelight visible to vessels on starboard side" },
      { type: "sternlight", arc: 135, color: "white", startAngle: 112.5, range: 3, position: "stern", purpose: "Sternlight showing vessel from astern" },
    ],
  },
  "power-driven-over-50m": {
    title: "Power-Driven Vessel ≥50m",
    lengthGroup: "power-driven",
    lights: [
      { type: "masthead", arc: 225, color: "white", startAngle: -112.5, range: 6, position: "center", purpose: "Forward masthead light (vessels over 50m)" },
      { type: "masthead-aft", arc: 225, color: "white", startAngle: -112.5, range: 6, position: "center", purpose: "Aft masthead light, higher than forward (vessels over 50m)" },
      { type: "sidelight-port", arc: 112.5, color: "red", startAngle: -112.5, range: 3, position: "port", purpose: "Port sidelight" },
      { type: "sidelight-starboard", arc: 112.5, color: "green", startAngle: 0, range: 3, position: "starboard", purpose: "Starboard sidelight" },
      { type: "sternlight", arc: 135, color: "white", startAngle: 112.5, range: 3, position: "stern", purpose: "Sternlight" },
    ],
  },
  "sailing-underway": {
    title: "Sailing Vessel ≥20m",
    vesselType: "sail",
    lengthGroup: "sailing",
    lights: [
      { type: "sidelight-port", arc: 112.5, color: "red", startAngle: -112.5, range: 2, position: "center", purpose: "Port sidelight for sailing vessel" },
      { type: "sidelight-starboard", arc: 112.5, color: "green", startAngle: 0, range: 2, position: "center", purpose: "Starboard sidelight for sailing vessel" },
      { type: "sternlight", arc: 135, color: "white", startAngle: 112.5, range: 2, position: "center", purpose: "Sternlight for sailing vessel" },
    ],
  },
  "sailing-under-20m": {
    title: "Sailing Vessel <20m",
    vesselType: "sail",
    lengthGroup: "sailing",
    lights: [
      // Combined tricolor lantern at masthead (Rule 25(b))
      { type: "tricolor", arc: 360, color: "white", startAngle: 0, range: 2, position: "center", purpose: "Tricolor lantern combining sidelights and sternlight at masthead" },
    ],
  },
  "sailing-optional": {
    title: "Sailing Vessel with Optional Lights",
    vesselType: "sail",
    lengthGroup: "sailing",
    lights: [
      // Rule 25(c) - optional red over green all-round lights at masthead
      { type: "all-round-upper", arc: 360, color: "red", startAngle: 0, range: 2, position: "center", purpose: "Optional red all-round light at masthead (Rule 25c)" },
      { type: "all-round-lower", arc: 360, color: "green", startAngle: 0, range: 2, position: "center", purpose: "Optional green all-round light at masthead (Rule 25c)" },
      { type: "sidelight-port", arc: 112.5, color: "red", startAngle: -112.5, range: 2, position: "center", purpose: "Port sidelight for sailing vessel" },
      { type: "sidelight-starboard", arc: 112.5, color: "green", startAngle: 0, range: 2, position: "center", purpose: "Starboard sidelight for sailing vessel" },
      { type: "sternlight", arc: 135, color: "white", startAngle: 112.5, range: 2, position: "center", purpose: "Sternlight for sailing vessel" },
    ],
  },
  "vessel-towing": {
    title: "Vessel Engaged in Towing",
    lights: [
      { type: "masthead", arc: 225, color: "white", startAngle: -112.5, range: 6, position: "center", purpose: "Forward masthead light for towing vessel" },
      { type: "sidelight-port", arc: 112.5, color: "red", startAngle: -112.5, range: 3, position: "port", purpose: "Port sidelight" },
      { type: "sidelight-starboard", arc: 112.5, color: "green", startAngle: 0, range: 3, position: "starboard", purpose: "Starboard sidelight" },
      { type: "towing", arc: 135, color: "yellow", startAngle: 112.5, range: 3, position: "stern", purpose: "Yellow towing light visible from astern" },
    ],
  },
  "not-under-command": {
    title: "Vessel Not Under Command",
    lights: [
      { type: "all-round-upper", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Upper red all-round light indicating not under command" },
      { type: "all-round-lower", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Lower red all-round light indicating not under command" },
    ],
  },
  "restricted-ability-to-maneuver": {
    title: "Vessel Restricted in Ability to Maneuver",
    lights: [
      { type: "all-round-upper", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Upper red light - restricted ability to maneuver" },
      { type: "all-round-middle", arc: 360, color: "white", startAngle: 0, range: 3, position: "center", purpose: "Middle white light - restricted ability to maneuver" },
      { type: "all-round-lower", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Lower red light - restricted ability to maneuver" },
    ],
  },
  "anchored": {
    title: "Vessel at Anchor",
    lights: [
      { type: "all-round", arc: 360, color: "white", startAngle: 0, range: 3, position: "center", purpose: "White all-round light indicating vessel at anchor" },
    ],
  },
  "aground": {
    title: "Vessel Aground",
    lights: [
      { type: "all-round-upper", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Upper red light indicating vessel aground" },
      { type: "all-round-lower", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Lower red light indicating vessel aground" },
      { type: "anchor", arc: 360, color: "white", startAngle: 0, range: 3, position: "center", purpose: "Anchor light" },
    ],
  },
  "fishing-trawling": {
    title: "Vessel Engaged in Trawling",
    lights: [
      { type: "all-round-upper", arc: 360, color: "green", startAngle: 0, range: 3, position: "center", purpose: "Green over white indicates vessel engaged in trawling" },
      { type: "all-round-lower", arc: 360, color: "white", startAngle: 0, range: 3, position: "center", purpose: "White light below green for trawling vessel" },
      { type: "sidelight-port", arc: 112.5, color: "red", startAngle: -112.5, range: 2, position: "port", purpose: "Port sidelight" },
      { type: "sidelight-starboard", arc: 112.5, color: "green", startAngle: 0, range: 2, position: "starboard", purpose: "Starboard sidelight" },
      { type: "sternlight", arc: 135, color: "white", startAngle: 112.5, range: 2, position: "stern", purpose: "Sternlight" },
    ],
  },
  "fishing-other": {
    title: "Vessel Engaged in Fishing (Other Than Trawling)",
    lights: [
      { type: "all-round-upper", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Red over white indicates vessel fishing (not trawling)" },
      { type: "all-round-lower", arc: 360, color: "white", startAngle: 0, range: 3, position: "center", purpose: "White light below red for fishing vessel" },
      { type: "sidelight-port", arc: 112.5, color: "red", startAngle: -112.5, range: 2, position: "port", purpose: "Port sidelight" },
      { type: "sidelight-starboard", arc: 112.5, color: "green", startAngle: 0, range: 2, position: "starboard", purpose: "Starboard sidelight" },
      { type: "sternlight", arc: 135, color: "white", startAngle: 112.5, range: 2, position: "stern", purpose: "Sternlight" },
    ],
  },
  "pilot-on-duty": {
    title: "Pilot Vessel on Duty",
    lights: [
      { type: "all-round-upper", arc: 360, color: "white", startAngle: 0, range: 3, position: "center", purpose: "White over red indicates pilot vessel on duty" },
      { type: "all-round-lower", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Red light below white for pilot vessel" },
      { type: "sidelight-port", arc: 112.5, color: "red", startAngle: -112.5, range: 2, position: "port", purpose: "Port sidelight" },
      { type: "sidelight-starboard", arc: 112.5, color: "green", startAngle: 0, range: 2, position: "starboard", purpose: "Starboard sidelight" },
      { type: "sternlight", arc: 135, color: "white", startAngle: 112.5, range: 2, position: "stern", purpose: "Sternlight" },
    ],
  },
  "constrained-by-draft": {
    title: "Vessel Constrained by Draft",
    lights: [
      { type: "all-round-upper", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Three red all-round lights indicate constrained by draft" },
      { type: "all-round-middle", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Middle red light for vessel constrained by draft" },
      { type: "all-round-lower", arc: 360, color: "red", startAngle: 0, range: 3, position: "center", purpose: "Lower red light for vessel constrained by draft" },
      { type: "masthead", arc: 225, color: "white", startAngle: -112.5, range: 6, position: "center", purpose: "Masthead light" },
      { type: "sidelight-port", arc: 112.5, color: "red", startAngle: -112.5, range: 3, position: "port", purpose: "Port sidelight" },
      { type: "sidelight-starboard", arc: 112.5, color: "green", startAngle: 0, range: 3, position: "starboard", purpose: "Starboard sidelight" },
      { type: "sternlight", arc: 135, color: "white", startAngle: 112.5, range: 3, position: "stern", purpose: "Sternlight" },
    ],
  },
};
