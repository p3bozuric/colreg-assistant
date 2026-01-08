"use client";

import {
  VesselLights,
  DayShapes,
  SoundSignal,
  MorseSignal,
  DAY_SHAPE_CONFIGS,
  FOG_SIGNALS,
  MORSE_CODES,
  VESSEL_TYPES,
  MARITIME_SIGNALS,
} from "@/components/visuals";

export default function VisualsDemo() {
  return (
    <div className="min-h-screen bg-background px-8 pb-8 pt-24">
      <h1 className="text-3xl font-bold mb-8 text-center">COLREG Lights & Shapes</h1>
      <p className="text-center text-muted mb-12 max-w-2xl mx-auto">
        Hover over lights and shapes to see details.
      </p>

      <div className="max-w-7xl mx-auto space-y-16">
        {/* ===== VESSEL LIGHTS (Side View) ===== */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2 text-center">
            Vessel Lights (Side View)
          </h2>
          <p className="text-sm text-muted text-center">All vessel types with their navigation lights that they must show while the Sun is not up.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {(Object.keys(VESSEL_TYPES) as Array<keyof typeof VESSEL_TYPES>).map((type) => (
              <div key={type} className="flex flex-col items-center">
                <p className="text-sm font-medium mb-2">{VESSEL_TYPES[type]}</p>
                <VesselLights type={type} size="sm" />
              </div>
            ))}
          </div>
        </section>

        {/* ===== DAY SHAPES ===== */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2 text-center">Day Shapes</h2>
          <p className="text-sm text-muted text-center">
            Daytime signals displayed on vessels. Hover for description and rule reference.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {Object.entries(DAY_SHAPE_CONFIGS).map(([key, config]) => (
              <div key={key} className="flex flex-col items-center">
                <DayShapes
                  shapes={config.shapes}
                  size="md"
                  title={config.title}
                  description={config.description}
                  rule={config.rule}
                />
                <p className="text-xs text-muted mt-2 text-center">{config.title}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
