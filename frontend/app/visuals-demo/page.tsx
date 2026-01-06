"use client";

import {
  VesselLights,
  LightArcs,
  DayShapes,
  SoundSignal,
  MorseSignal,
  VESSEL_LIGHT_CONFIGS,
  DAY_SHAPE_CONFIGS,
  FOG_SIGNALS,
  MORSE_CODES,
  VESSEL_TYPES,
  MARITIME_SIGNALS,
} from "@/components/visuals";

export default function VisualsDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">COLREG Visual Components Demo</h1>
      <p className="text-center text-muted mb-12 max-w-2xl mx-auto">
        Hover over lights and shapes to see details. Click speaker icons to play sounds.
      </p>

      <div className="max-w-7xl mx-auto space-y-16">
        {/* ===== VESSEL LIGHTS (Side View) ===== */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">
            Vessel Lights (Side View)
          </h2>
          <p className="text-sm text-muted">All vessel types with their navigation lights</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(Object.keys(VESSEL_TYPES) as Array<keyof typeof VESSEL_TYPES>).map((type) => (
              <div key={type} className="flex flex-col items-center">
                <p className="text-sm font-medium mb-2">{VESSEL_TYPES[type]}</p>
                <VesselLights type={type} size="sm" />
              </div>
            ))}
          </div>
        </section>

        {/* ===== LIGHT ARCS (Top View) ===== */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">
            Light Arcs (Top View)
          </h2>
          <p className="text-sm text-muted">
            Light visibility sectors from above. Hover for details. Angle indicators show arc coverage.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(VESSEL_LIGHT_CONFIGS).map(([key, config]) => (
              <div key={key} className="flex flex-col items-center">
                <p className="text-sm font-medium mb-2 text-center">{config.title}</p>
                <LightArcs lights={config.lights} vesselType={config.vesselType} size={200} />
              </div>
            ))}
          </div>
        </section>

        {/* ===== DAY SHAPES ===== */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">Day Shapes</h2>
          <p className="text-sm text-muted">
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

        {/* ===== SOUND SIGNALS ===== */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">Sound Signals</h2>
          <p className="text-sm text-muted">
            Fog signals (Rule 35) and maneuvering signals (Rule 34). Click the speaker to play.
          </p>

          {/* Fog Signals */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-primary">Fog Signals (Rule 35)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(FOG_SIGNALS)
                .filter(([_, config]) => config.rule?.includes("35"))
                .map(([key, config]) => (
                  <div key={key} className="p-4 bg-card-bg rounded-lg border border-border">
                    <SoundSignal pattern={config.pattern} label={config.description} size="sm" />
                    <p className="text-xs text-primary mt-2">{config.rule}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Maneuvering Signals */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-primary">Maneuvering Signals (Rule 34)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(FOG_SIGNALS)
                .filter(([_, config]) => config.rule?.includes("34"))
                .map(([key, config]) => (
                  <div key={key} className="p-4 bg-card-bg rounded-lg border border-border">
                    <SoundSignal pattern={config.pattern} label={config.description} size="sm" />
                    <p className="text-xs text-primary mt-2">{config.rule}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* ===== MORSE CODE SIGNALS ===== */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">
            Morse Code / Single Letter Signals
          </h2>
          <p className="text-sm text-muted">
            International maritime single-letter signals. Click to hear the morse code.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Object.entries(MORSE_CODES).map(([letter, pattern]) => (
              <div key={letter} className="p-3 bg-card-bg rounded-lg border border-border">
                <MorseSignal letter={letter} pattern={pattern} size="sm" />
                <p className="text-xs text-muted mt-2 line-clamp-2">
                  {MARITIME_SIGNALS[letter]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== COMPONENT PARAMETERS REFERENCE ===== */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">
            Component Parameters Reference
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* VesselLights */}
            <div className="p-4 bg-card-bg rounded-lg border border-border">
              <h3 className="font-semibold text-primary mb-2">VesselLights</h3>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`type: "power-driven" | "sailing" | "fishing" |
      "trawling" | "nuc" | "ram" | "cbd" |
      "towing" | "pushing" | "anchored" |
      "aground" | "pilot"
length: "under7m" | "under12m" | "under20m" |
        "under50m" | "over50m"
view: "port" | "starboard" | "ahead" | "stern"
size: "sm" | "md" | "lg"`}</pre>
            </div>

            {/* LightArcs */}
            <div className="p-4 bg-card-bg rounded-lg border border-border">
              <h3 className="font-semibold text-primary mb-2">LightArcs</h3>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`config: "power-driven-underway" | "power-driven-over-50m" |
        "sailing-underway" | "vessel-towing" |
        "not-under-command" | "restricted-ability-to-maneuver" |
        "anchored" | "aground" | "fishing-trawling" |
        "fishing-other" | "pilot-on-duty" | "constrained-by-draft"
vesselType: "power" | "sail" (default: "power")
size: number (default: 220)`}</pre>
            </div>

            {/* DayShapes */}
            <div className="p-4 bg-card-bg rounded-lg border border-border">
              <h3 className="font-semibold text-primary mb-2">DayShapes</h3>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`config: "anchored" | "nuc" | "ram" | "cbd" |
        "aground" | "sailing-motor" | "fishing-trawling" |
        "fishing-other" | "towing-over-200m" |
        "mine-clearance" | "diving-operations"
shapes: ["ball", "cone-apex-up", "cone-apex-down",
         "diamond", "cylinder"]
size: "sm" | "md" | "lg"`}</pre>
            </div>

            {/* SoundSignal */}
            <div className="p-4 bg-card-bg rounded-lg border border-border">
              <h3 className="font-semibold text-primary mb-2">SoundSignal</h3>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`pattern: "prolonged" | "short" | "prolonged-short" |
         "prolonged-prolonged" | "short-short-short" |
         "short-short-short-short-short" (danger)
         (dash-separated: "prolonged" ~2s, "short" ~0.4s)
size: "sm" | "md" | "lg"`}</pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
