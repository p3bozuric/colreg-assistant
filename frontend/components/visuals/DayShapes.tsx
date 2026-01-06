"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ShapeType =
  | "ball"
  | "cone-apex-up"
  | "cone-apex-down"
  | "diamond"
  | "cylinder";

interface DayShapesProps {
  shapes: ShapeType[];
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  label?: string;
  title?: string;
  description?: string;
  rule?: string;
}

// Shape descriptions for tooltips
const SHAPE_DESCRIPTIONS: Record<ShapeType, string> = {
  "ball": "Black ball shape",
  "cone-apex-up": "Cone with apex pointing upward",
  "cone-apex-down": "Cone with apex pointing downward",
  "diamond": "Diamond shape (two cones base to base)",
  "cylinder": "Cylinder shape",
};

const SIZE_CONFIG = {
  sm: { shape: 24, gap: 8, stroke: 1.5 },
  md: { shape: 32, gap: 12, stroke: 2 },
  lg: { shape: 48, gap: 16, stroke: 2.5 },
};

interface ShapeProps {
  type: ShapeType;
  size: number;
  strokeWidth: number;
  animated?: boolean;
  index: number;
}

function Shape({ type, size, strokeWidth, animated, index }: ShapeProps) {
  const center = size / 2;
  const radius = (size - strokeWidth * 2) / 2;

  const animationProps = animated
    ? {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay: index * 0.1, duration: 0.3 },
      }
    : {};

  const renderShape = () => {
    switch (type) {
      case "ball":
        return (
          <circle
            cx={center}
            cy={center}
            r={radius * 0.8}
            className="fill-foreground/90 stroke-foreground"
            strokeWidth={strokeWidth}
          />
        );

      case "cone-apex-up":
        return (
          <polygon
            points={`${center},${strokeWidth} ${size - strokeWidth},${size - strokeWidth} ${strokeWidth},${size - strokeWidth}`}
            className="fill-foreground/90 stroke-foreground"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );

      case "cone-apex-down":
        return (
          <polygon
            points={`${strokeWidth},${strokeWidth} ${size - strokeWidth},${strokeWidth} ${center},${size - strokeWidth}`}
            className="fill-foreground/90 stroke-foreground"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );

      case "diamond":
        return (
          <polygon
            points={`${center},${strokeWidth} ${size - strokeWidth},${center} ${center},${size - strokeWidth} ${strokeWidth},${center}`}
            className="fill-foreground/90 stroke-foreground"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );

      case "cylinder":
        // Draw cylinder as rectangle with rounded ends
        const cylinderWidth = size * 0.6;
        const cylinderHeight = size * 0.85;
        const x = (size - cylinderWidth) / 2;
        const y = (size - cylinderHeight) / 2;
        return (
          <rect
            x={x}
            y={y}
            width={cylinderWidth}
            height={cylinderHeight}
            rx={cylinderWidth / 2}
            className="fill-foreground/90 stroke-foreground"
            strokeWidth={strokeWidth}
          />
        );

      default:
        return null;
    }
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      {...animationProps}
    >
      {renderShape()}
    </motion.svg>
  );
}

export default function DayShapes({
  shapes,
  size = "md",
  animated = true,
  label,
  title,
  description,
  rule,
}: DayShapesProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = SIZE_CONFIG[size];

  // Generate shape description list
  const shapesList = shapes.map(s => SHAPE_DESCRIPTIONS[s]).join(" + ");

  return (
    <div className="inline-flex flex-col items-center gap-2 relative">
      {label && (
        <span className="text-xs text-muted">{label}</span>
      )}
      <div
        className="flex flex-col items-center bg-sky-100/20 dark:bg-sky-900/20 rounded-lg p-3 border border-sky-200/30 dark:border-sky-800/30 cursor-pointer relative"
        style={{ gap: config.gap }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Mast line behind shapes */}
        <div
          className="absolute bg-foreground/30"
          style={{
            width: 2,
            height: shapes.length * config.shape + (shapes.length - 1) * config.gap,
          }}
        />
        {shapes.map((shape, idx) => (
          <Shape
            key={idx}
            type={shape}
            size={config.shape}
            strokeWidth={config.stroke}
            animated={animated}
            index={idx}
          />
        ))}

        {/* Hover tooltip */}
        <AnimatePresence>
          {isHovered && (title || description || rule) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 rounded-lg bg-card-bg border border-border shadow-xl backdrop-blur-md text-sm"
            >
              {title && (
                <p className="font-medium text-foreground mb-1">{title}</p>
              )}
              <p className="text-xs text-muted mb-1">{description}</p>
              {rule && (
                <p className="text-xs text-primary">{rule}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Common day shape configurations from COLREGs
export const DAY_SHAPE_CONFIGS: Record<string, { shapes: ShapeType[]; title: string; description: string; rule: string }> = {
  "anchored": {
    shapes: ["ball"],
    title: "Anchored",
    description: "Vessel at anchor - placed where best seen in the fore part of the vessel.",
    rule: "Rule 30(a)",
  },
  "nuc": {
    shapes: ["ball", "ball"],
    title: "Not under command",
    description: "Vessel is not under command - shapes in a vertical line where they can best be seen",
    rule: "Rule 27(a)",
  },
  "ram": {
    shapes: ["ball", "diamond", "ball"],
    title: "Restricted in ability to maneuver",
    description: "Vessel restricted in ability to maneuver - placed in a vertical line where they can best be seen",
    rule: "Rule 27(b)",
  },
  "ram-underwater-ops": {
    shapes: ["ball", "diamond", "ball"],
    title: "Underwater operations",
    description: "Vessel restricted in ability to maneuver because of underwater operations - placed in a vertical line where they can best be seen. Supplementary shapes required for indication of obstructions and free passage.",
    rule: "Rule 27(b)(ii)",
  },
  "ram-underwater-ops-vessel-may-pass": {
    shapes: ["diamond", "diamond"],
    title: "Underwater operations - Vessel May Pass",
    description: "Shapes that indicate the side on which another vessel may pass in case of underwater operations.",
    rule: "Rule 27(b)(ii)",
  },
  "ram-underwater-ops-obstruction": {
    shapes: ["ball", "ball"],
    title: "Underwater operations - Obstruction",
    description: "Shapes that indicate the side on which obstructions exist in case of underwater operations.",
    rule: "Rule 27(b)(ii)",
  },
  "cbd": {
    shapes: ["cylinder"],
    title: "Constrained by draught",
    description: "Constrained by draught - exhibiting the shape where it can best be seen.",
    rule: "Rule 28",
  },
  "aground": {
    shapes: ["ball", "ball", "ball"],
    title: "Vessel aground",
    description: "Aground vessel should exhibit the shapes in a vertical line where they can best be seen.",
    rule: "Rule 30(d)",
  },
  "sailing-motor": {
    shapes: ["cone-apex-down"],
    title: "Sailing vessel under power (motor-sailing)",
    description: "Sailing vessel under power (motor-sailing)",
    rule: "Rule 25(e)",
  },
  "towing-over-200m": {
    shapes: ["diamond"],
    title: "Towing over 200m",
    description: "Vessel towing & vessel being towed both exhibit the shape (tow length over 200m)",
    rule: "Rule 24",
  },
  "towing-submerged-under-200m": {
    shapes: ["diamond"],
    title: "Towing Partially Submerged under 200m",
    description: "Only partially submerged vessel being towed needs to exhibit the shape (tow length under 200m)",
    rule: "Rule 24",
  },
  "towing-submerged-over-200m": {
    shapes: ["diamond"],
    title: "Towing Partially Submerged over 200m",
    description: "Partially submerged vessel exhibit the shape on fore and aft, while towing vessel exhibits the shape where best seen (tow length over 200m)",
    rule: "Rule 24",
  },
  "fishing": {
    shapes: ["cone-apex-down", "cone-apex-up"],
    title: "Fishing - Regular",
    description: "Vessel engaged in trawling or other fishing other then trawling (but gear does not extend more than 150m horizontally from the vessel)",
    rule: "Rule 26",
  },
  "fishing-gear": {
    shapes: ["cone-apex-up"],
    title: "Fishing - Gear Over 150m",
    description: "Vessel engaged in fishing - when gear extends more than 150m horizontally from the vessel. This shape should be exhibited on the side on which the gear is extended.",
    rule: "Rule 26",
  },

// TODO: This situation is not covered well, it should be like a triangle: https://www.ecolregs.com/index.php?option=com_k2&view=item&id=361:a-vessel-engaged-in-mine-clearance-operations-underway-shapes&Itemid=505&lang=en
  "mine-clearance": {
    shapes: ["ball", "ball", "ball"],
    title: "Mine Clearance",
    description: "Vessel engaged in mine clearance. One of these shapes shall be exhibited near the foremast head and one at each end of the fore yard. These shapes indicate that it is dangerous for another vessel to approach within 1000 m of the mine clearance vessel.",
    rule: "Rule 27(f)",
  },
//TODO: this situation needs to be covered: https://www.ecolregs.com/index.php?option=com_k2&view=item&id=358:a-vessel-engaged-in-diving-operations-sign&Itemid=505&lang=en
  "diving-operations": {
    shapes: ["ball"],
    title: "Diving Operations",
    description: "When not practicable to exhibit usual shapes, a vessel engaged in diving operations may exhibit a rigid replica of the International Code flag 'A' now less then 1 metre in height.",
    rule: "Rule 27(d)",
  },
};
