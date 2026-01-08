"use client";

import {
  SoundSignal,
  SoundCard,
  MorseSignal,
  MorseCard,
  FOG_SIGNALS,
  MORSE_CODES,
  MARITIME_SIGNALS,
} from "@/components/visuals";

export default function VisualsDemo() {
  return (
    <div className="min-h-screen bg-background px-8 pb-8 pt-24">
      <h1 className="text-3xl font-bold mb-8 text-center">COLREG Sound Signals</h1>
      <p className="text-center text-muted mb-12 max-w-2xl mx-auto">
        Click speaker icons to play sounds.
      </p>

        {/* Fog Signals Section */}
        <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-primary text-center">
            Fog Signals
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(FOG_SIGNALS)
            .filter(([_, config]) => config.rule?.includes("35"))
            .map(([key, config]) => (
                <SoundCard key={key} config={config} />
            ))}
        </div>
        </div>

        {/* Maneuvering Signals Section */}
        <div className="mt-12">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-primary text-center">
            Maneuvering Signals
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(FOG_SIGNALS)
            .filter(([_, config]) => config.rule?.includes("34"))
            .map(([key, config]) => (
                <SoundCard key={key} config={config} />
            ))}
        </div>
        </div>

        {/* ===== MORSE CODE SIGNALS ===== */}
        <section className="space-y-6 mt-16">
        <h2 className="text-2xl font-semibold border-b border-border pb-2 text-center">
            Morse Code / Single Letter Signals
        </h2>
        <p className="text-sm text-muted text-center">
            International maritime single-letter signals. Click to hear the morse code.
        </p>

        {/* Grid with increased gap (gap-6) and fewer columns for better readability */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(MORSE_CODES).map(([letter, pattern]) => (
            <MorseCard
                key={letter}
                letter={letter}
                pattern={pattern}
                description={MARITIME_SIGNALS[letter]}
            />
            ))}
        </div>
        </section>
    </div>
  );
}
