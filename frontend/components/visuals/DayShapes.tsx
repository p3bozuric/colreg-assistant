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
          {isHovered && (description || rule) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 rounded-lg bg-card-bg border border-border shadow-xl backdrop-blur-md text-sm"
            >
              {description && (
                <p className="font-medium text-foreground mb-1">{description}</p>
              )}
              <p className="text-xs text-muted mb-1">{shapesList}</p>
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
export const DAY_SHAPE_CONFIGS: Record<string, { shapes: ShapeType[]; description: string; rule: string }> = {
  "anchored": {
    shapes: ["ball"],
    description: "Vessel at anchor",
    rule: "Rule 30(a)",
  },
  "nuc": {
    shapes: ["ball", "ball"],
    description: "Not under command",
    rule: "Rule 27(a)",
  },
  "ram": {
    shapes: ["ball", "diamond", "ball"],
    description: "Restricted in ability to maneuver",
    rule: "Rule 27(b)",
  },
  "cbd": {
    shapes: ["cylinder"],
    description: "Constrained by draught",
    rule: "Rule 28",
  },
  "aground": {
    shapes: ["ball", "ball", "ball"],
    description: "Vessel aground",
    rule: "Rule 30(d)",
  },
  "sailing-motor": {
    shapes: ["cone-apex-down"],
    description: "Sailing vessel under power (motor-sailing)",
    rule: "Rule 25(e)",
  },
  "fishing-trawling": {
    shapes: ["cone-apex-up", "cone-apex-down"],
    description: "Vessel engaged in trawling",
    rule: "Rule 26(b)",
  },
  "fishing-other": {
    shapes: ["cone-apex-up", "cone-apex-down"],
    description: "Vessel engaged in fishing (other than trawling)",
    rule: "Rule 26(c)",
  },
  "towing-over-200m": {
    shapes: ["diamond"],
    description: "Vessel towing (tow length over 200m)",
    rule: "Rule 24(a)",
  },
  "mine-clearance": {
    shapes: ["ball", "ball", "ball"],
    description: "Vessel engaged in mine clearance",
    rule: "Rule 27(f)",
  },
  "diving-operations": {
    shapes: ["ball", "diamond", "ball"],
    description: "Vessel engaged in diving operations (RAM)",
    rule: "Rule 27(b)",
  },
};
