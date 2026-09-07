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
    <section className="relative z-10 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-4 sm:pb-6 flex flex-col justify-center">
      {/* Balanced 2-Column Responsive Hero Grid: Left Content + Right 3D Earth */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        
        {/* LEFT COLUMN: Headings, Subheadings & Topic Chips (lg:col-span-6 xl:col-span-7) */}
        <div className="lg:col-span-6 xl:col-span-7 text-left flex flex-col justify-center">
          {/* Subtle Aerospace Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-400 text-[11px] font-medium tracking-wide w-fit mb-4 backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="uppercase font-mono text-[10px] tracking-wider text-blue-300">
              Agentic Vision-Language System
            </span>
          </div>

          {/* Main Heading (Two Lines) */}
          <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.08] mb-4">
            The Earth <br />
            <span className="text-white">
              in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 underline decoration-blue-500/50 decoration-4 underline-offset-4">Questions</span>
            </span>
          </h1>

          {/* Subheading (Two Lines) */}
          <div className="space-y-1 text-slate-300 text-base sm:text-lg font-normal max-w-xl">
            <p className="font-medium text-slate-200">Ask. Analyze. Understand.</p>
            <p className="text-slate-400 text-sm sm:text-base">Satellite insights, made simple.</p>
          </div>

          {/* Row of 6 Pill/Chip Buttons in a 3+3 Grid */}
          <div className="mt-8 max-w-xl">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3 flex items-center gap-2 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>CAPABILITIES & PRESETS</span>
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

        {/* RIGHT COLUMN: Photorealistic 3D Gyroscope Earth (lg:col-span-6 xl:col-span-5) */}
        <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center py-2 lg:py-0">
          <EarthVisual />
        </div>

      </div>
    </section>
  );
};
