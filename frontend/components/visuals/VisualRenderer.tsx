"use client";

import { Visual } from "@/types";
import VesselLights from "./VesselLights";
import DayShapes, { DAY_SHAPE_CONFIGS } from "./DayShapes";
import SoundSignal, { FOG_SIGNALS } from "./SoundSignal";
import MorseSignal, { MORSE_CODES, MARITIME_SIGNALS } from "./MorseSignal";
import { VESSEL_TYPES } from "./VesselLights";

interface VisualRendererProps {
  visual: Visual;
}

// Map light-arcs config to VesselLights props
const LIGHT_ARCS_TO_VESSEL_LIGHTS: Record<string, { type: Parameters<typeof VesselLights>[0]["type"]; length?: Parameters<typeof VesselLights>[0]["length"] }> = {
  "power-driven": { type: "power-driven" },
  "sailing": { type: "sailing"},
  "fishing-trawling": { type: "fishing-trawling" },
  "fishing-other": { type: "fishing-other" },
  "vessel-towing": { type: "vessel-towing" },
  "vessel-pushing": { type: "vessel-pushing" },
  "not-under-command": { type: "not-under-command" },
  "restricted-ability-to-maneuver": { type: "restricted-ability-to-maneuver" },
  "restricted-ability-to-maneuver-underwater-operations": { type: "restricted-ability-to-maneuver-underwater-operations" },
  "restricted-ability-to-maneuver-mine-clearance": { type: "restricted-ability-to-maneuver-mine-clearance" },
  "anchored": { type: "anchored" },
  "aground": { type: "aground" },
  "pilot-on-duty": { type: "pilot-on-duty" },
  "constrained-by-draft": { type: "constrained-by-draft" },
  "seaplane": { type: "seaplane" },
};

export default function VisualRenderer({ visual }: VisualRendererProps) {
  const { type, data, caption } = visual;

  const renderVisual = () => {
    switch (type) {
      case "vessel-lights": {
        const vesselType = data.config as string | undefined;
        const size = data.size as "sm" | "md" | "lg" | undefined;

        return (
          <VesselLights
            type={vesselType as Parameters<typeof VesselLights>[0]["type"]}
            size={size || "sm"}
          />
        );
      }

      case "day-shapes": {
        const configKey = data.config as string | undefined;
        const config = configKey && DAY_SHAPE_CONFIGS[configKey]
          ? DAY_SHAPE_CONFIGS[configKey]
          : null;
        const shapes = config
          ? config.shapes
          : (data.shapes as Parameters<typeof DayShapes>[0]["shapes"]);
        const size = data.size as "sm" | "md" | "lg" | undefined;
        // Pass description and rule for hover tooltip only
        const description = config?.description;
        const rule = config?.rule;

        return shapes ? (
          <DayShapes shapes={shapes} size={size || "md"} description={description} rule={rule} />
        ) : null;
      }

      case "sound-signal": {
        const configKey = data.config as string | undefined;
        const config = configKey && FOG_SIGNALS[configKey]
          ? FOG_SIGNALS[configKey]
          : null;
        const pattern = config?.pattern || (data.pattern as string);
        const size = data.size as "sm" | "md" | "lg" | undefined;

        return pattern ? (
          <SoundSignal pattern={pattern} size={size || "md"} />
        ) : null;
      }

      case "morse-signal": {
        const letter = data.letter as string;
        const pattern = MORSE_CODES[letter] || (data.pattern as string);
        const showMeaning = data.showMeaning as boolean | undefined;
        const size = data.size as "sm" | "md" | "lg" | undefined;

        return pattern ? (
          <div className="flex flex-col gap-2">
            <MorseSignal
              letter={letter}
              pattern={pattern}
              size={size || "md"}
            />
            {showMeaning && MARITIME_SIGNALS[letter] && (
              <p className="text-xs text-muted italic">
                {MARITIME_SIGNALS[letter]}
              </p>
            )}
          </div>
        ) : null;
      }

      default:
        return null;
    }
  };

  const renderedVisual = renderVisual();

  if (!renderedVisual) return null;

  // Day shapes: no caption (only hover tooltip)
  // Sound signal: caption ABOVE
  // Others: caption below
  const showCaptionAbove = type === "sound-signal" && caption;
  const showCaptionBelow = type !== "day-shapes" && type !== "sound-signal" && caption;

  return (
    <div className="my-3 flex flex-col items-center gap-2">
      {showCaptionAbove && (
        <p className="text-xs text-muted text-center max-w-[280px]">
          {caption}
        </p>
      )}
      {renderedVisual}
      {showCaptionBelow && (
        <p className="text-xs text-muted text-center max-w-[280px]">
          {caption}
        </p>
      )}
    </div>
  );
}
