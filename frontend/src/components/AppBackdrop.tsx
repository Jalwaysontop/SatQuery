import React, { useMemo } from 'react';

interface CinematicStar {
  id: number;
  top: number;
  left: number;
  size: number;
  opacity: number;
  color: string;
  twinkleDuration?: number;
  twinkleDelay?: number;
}

export const AppBackdrop: React.FC = () => {
  const stars: CinematicStar[] = useMemo(() => {
    const list: CinematicStar[] = [];
    const count = 120;

    const colors = [
      '#ffffff',
      '#f8fafc',
      '#e2e8f0',
      '#fef3c7',
      '#fde68a',
    ];

    for (let i = 0; i < count; i++) {
      const p1 = Math.sin(i * 1234.567 + 1) * 10000;
      const r1 = p1 - Math.floor(p1);
      const p2 = Math.sin(i * 9876.543 + 2) * 10000;
      const r2 = p2 - Math.floor(p2);
      const p3 = Math.sin(i * 4567.891 + 3) * 10000;
      const r3 = p3 - Math.floor(p3);
      const p4 = Math.sin(i * 7891.234 + 4) * 10000;
      const r4 = p4 - Math.floor(p4);

      let size = 0.6;
      if (r3 > 0.97) size = 1.8;
      else if (r3 > 0.92) size = 1.3;
      else if (r3 > 0.75) size = 0.9;
      else size = 0.55;

      const colorIndex = Math.floor(r4 * colors.length);
      const color = colors[colorIndex];
      const opacity = Math.max(0.08, Math.min(0.65, 0.1 + r2 * 0.55));

      list.push({
        id: i,
        top: Math.round(r1 * 100 * 10) / 10,
        left: Math.round(r2 * 100 * 10) / 10,
        size,
        opacity,
        color,
        twinkleDuration: r3 > 0.7 ? 4 + r1 * 5 : undefined,
        twinkleDelay: r3 > 0.7 ? r2 * 6 : undefined,
      });
    }
    return list;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none" style={{ backgroundColor: '#02050A' }}>
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #060d1a 0%, #02050A 45%, #010206 100%)',
        }}
      />

      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            opacity: star.opacity,
            boxShadow:
              star.size > 1.5
                ? `0 0 ${star.size * 2}px ${star.size * 0.5}px ${star.color}44`
                : star.size > 1.0
                ? `0 0 ${star.size}px ${star.color}33`
                : 'none',
            animation: star.twinkleDuration
              ? `pulse ${star.twinkleDuration}s cubic-bezier(0.4, 0, 0.6, 1) infinite`
              : undefined,
            animationDelay: star.twinkleDelay ? `${star.twinkleDelay}s` : undefined,
          }}
        />
      ))}

      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/15 to-transparent" />
    </div>
  );
};