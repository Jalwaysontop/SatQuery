import React, { useMemo } from 'react';

interface RealisticStar {
  id: number;
  top: number;
  left: number;
  size: number;
  opacity: number;
  color: string;
  hasSpike: boolean;
  twinkleDuration?: number;
  twinkleDelay?: number;
}

export const AppBackdrop: React.FC = () => {
  // Generate multi-tiered realistic micro-stars
  const stars: RealisticStar[] = useMemo(() => {
    const list: RealisticStar[] = [];
    const count = 180;

    // Astronomical star spectral color palette
    const colors = [
      '#ffffff', // Class A (Pure White)
      '#e0f2fe', // Class B (Diamond Ice Blue)
      '#bae6fd', // Class O (Vivid Cyan-Blue)
      '#fef3c7', // Class F/G (Warm Golden Yellow)
      '#fed7aa', // Class K (Soft Orange)
      '#ffffff',
      '#e2e8f0',
    ];

    for (let i = 0; i < count; i++) {
      // Deterministic PRNG seeded values
      const p1 = Math.sin(i * 1234.567 + 1) * 10000;
      const r1 = p1 - Math.floor(p1);
      const p2 = Math.sin(i * 9876.543 + 2) * 10000;
      const r2 = p2 - Math.floor(p2);
      const p3 = Math.sin(i * 4567.891 + 3) * 10000;
      const r3 = p3 - Math.floor(p3);
      const p4 = Math.sin(i * 7891.234 + 4) * 10000;
      const r4 = p4 - Math.floor(p4);

      // Star size distribution: majority are tiny pinpoint specs (0.6px - 1.2px)
      let size = 0.8;
      let hasSpike = false;
      if (r3 > 0.94) {
        size = 2.2;
        hasSpike = true;
      } else if (r3 > 0.82) {
        size = 1.6;
      } else if (r3 > 0.55) {
        size = 1.1;
      } else {
        size = 0.7;
      }

      const colorIndex = Math.floor(r4 * colors.length);
      const color = colors[colorIndex];
      const opacity = Math.max(0.12, Math.min(0.85, 0.2 + r2 * 0.65));

      list.push({
        id: i,
        top: Math.round(r1 * 100 * 10) / 10,
        left: Math.round(r2 * 100 * 10) / 10,
        size,
        opacity,
        color,
        hasSpike,
        twinkleDuration: r3 > 0.6 ? 3 + r1 * 4 : undefined,
        twinkleDelay: r3 > 0.6 ? r2 * 5 : undefined,
      });
    }
    return list;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none bg-[#02050e]">
      {/* 1. Deep Space Cosmic Canvas with Vignette Gradient */}
      <div className="absolute inset-0 bg-radial-at-c from-[#050b1d] via-[#02050f] to-[#010207] opacity-95" />

      {/* 2. Realistic Cinematic Nebula Dust Filaments */}
      {/* Deep Sapphire Core Nebula */}
      <div
        className="absolute top-[10%] left-[40%] -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[140px] opacity-25"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(30, 64, 175, 0.45) 0%, rgba(15, 23, 42, 0) 70%)',
        }}
      />
      {/* Midnight Cyan Atmospheric Fringe */}
      <div
        className="absolute top-[25%] right-[10%] w-[600px] h-[550px] rounded-full blur-[120px] opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(2, 6, 23, 0) 65%)',
        }}
      />
      {/* Deep Cosmic Purple / Indigo Dust Lane */}
      <div
        className="absolute bottom-[5%] left-[15%] w-[750px] h-[450px] rounded-full blur-[150px] opacity-15"
        style={{
          background: 'radial-gradient(ellipse, rgba(79, 70, 229, 0.3) 0%, rgba(2, 6, 23, 0) 70%)',
        }}
      />

      {/* 3. Milky Way Galactic Diagonal Stardust Band */}
      <div
        className="absolute -inset-[30%] opacity-15 rotate-[-25deg] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 25% at 50% 50%, rgba(147, 197, 253, 0.25) 0%, rgba(30, 58, 138, 0.1) 40%, transparent 75%)',
          filter: 'blur(40px)',
        }}
      />

      {/* 4. Fine Aerospace Orbital Reticle & Azimuth Coordinate Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #93c5fd 1px, transparent 1px),
            linear-gradient(to bottom, #93c5fd 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 45%, black 25%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 45%, black 25%, transparent 80%)',
        }}
      />

      {/* 5. Realistic Micro-Stars Layer */}
      {stars.map((star) => (
        <React.Fragment key={star.id}>
          <span
            className="absolute rounded-full pointer-events-none"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              opacity: star.opacity,
              boxShadow:
                star.size > 1.8
                  ? `0 0 6px 1px ${star.color}, 0 0 12px 2px rgba(96, 165, 250, 0.4)`
                  : star.size > 1.2
                  ? `0 0 3px ${star.color}`
                  : 'none',
              animation: star.twinkleDuration
                ? `pulse ${star.twinkleDuration}s cubic-bezier(0.4, 0, 0.6, 1) infinite`
                : undefined,
              animationDelay: star.twinkleDelay ? `${star.twinkleDelay}s` : undefined,
            }}
          />
          {/* Optical Diffraction Spikes on Brighter Stars */}
          {star.hasSpike && (
            <div
              className="absolute pointer-events-none"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                transform: 'translate(-50%, -50%)',
                opacity: star.opacity * 0.6,
              }}
            >
              <div className="w-4 h-[0.5px] bg-white/60 -translate-x-1/2" />
              <div className="h-4 w-[0.5px] bg-white/60 -translate-y-1/2 -mt-[0.25px]" />
            </div>
          )}
        </React.Fragment>
      ))}

      {/* Subtle Top Aerospace Border Accent */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </div>
  );
};
