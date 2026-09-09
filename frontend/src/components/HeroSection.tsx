import React from 'react';
import { Sparkles } from 'lucide-react';
import { EarthVisual } from './EarthVisual';
import { useQueryContext } from '../context/useQueryContext';

const topicPrefillMap: Record<string, string> = {
  'VQA — Single Image':    'What land-use classes are present in this satellite image?',
  'Change Detection':      'How much did the urban area grow between these two images?',
  'SAR + Optical Fusion':  'Fuse optical and SAR imagery to identify flooded regions',
  'Flood Mapping':         'Map the flood extent and affected zones in this SAR image',
  'Deforestation':         'Detect deforestation and forest cover loss in this region',
  'Crop & Agriculture':    'Assess crop health and identify stressed vegetation using NDVI',
};

export const HeroSection: React.FC = () => {
  const { prefillQuery } = useQueryContext();

  const handleChipClick = (topic: string) => {
    const sampleQuestion = topicPrefillMap[topic] || `Analyze ${topic.toLowerCase()} in selected region`;
    prefillQuery(sampleQuestion);
  };

  return (
    /**
     * The section is the full content-column width.
     * We give it a fixed height so the absolute-positioned Earth
     * has a well-defined container to center within.
     *
     * Layout intent:
     *   • Earth  — absolute, horizontally centered in this section,
     *              vertically centered, z-index 0
     *   • Text   — relative, left side, z-index above Earth
     *              It sits over the NIGHT (dark) left hemisphere.
     *   • The terminator shadow in EarthVisual darkens the left half,
     *              so the text reads cleanly against the dark Earth.
     */
    <section
      className="relative z-10 w-full"
      style={{ minHeight: '480px', height: 'clamp(480px, 55vh, 580px)' }}
    >
      {/* ── Earth — absolutely centered in section ────────────────────────── */}
      {/* No pointer-events-none here — EarthVisual manages its own hover */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {/*
         * EarthVisual itself re-enables pointer-events on its outer div
         * so hover-parallax works when the user hovers the Earth area.
         * The text content (z-10) sits on top and receives clicks first.
         */}
        <EarthVisual />
      </div>

      {/* ── Text content — left-aligned, over the dark night side ─────────── */}
      <div
        className="relative flex flex-col justify-center h-full px-4 sm:px-6 lg:px-8 max-w-[520px]"
        style={{ zIndex: 10 }}
      >
        {/* Aerospace tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-400 text-[11px] font-medium tracking-wide w-fit mb-4 backdrop-blur-md shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="uppercase font-mono text-[10px] tracking-wider text-blue-300">
            Agentic Vision-Language System
          </span>
        </div>

        {/* Main heading */}
        <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.08] mb-4">
          The Earth <br />
          <span className="text-white">
            in your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 underline decoration-blue-500/50 decoration-4 underline-offset-4">
              Questions
            </span>
          </span>
        </h1>

        {/* Subheading */}
        <div className="space-y-1 text-slate-300 text-base sm:text-lg font-normal">
          <p className="font-medium text-slate-200">Ask. Analyze. Understand.</p>
          <p className="text-slate-400 text-sm sm:text-base">Satellite insights, made simple.</p>
        </div>

        {/* Capability chips */}
        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3 flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Capabilities</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.keys(topicPrefillMap).map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => handleChipClick(topic)}
                className="
                  px-3.5 py-2 rounded-full text-xs font-medium text-slate-300
                  bg-[#0b101f]/90 hover:bg-[#121a30]
                  border border-slate-800/90 hover:border-blue-500/60 hover:text-white
                  shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]
                  transition-all duration-150 text-center truncate cursor-pointer
                  active:scale-95 backdrop-blur-sm
                "
                title={`Prefill: "${topicPrefillMap[topic]}"`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
