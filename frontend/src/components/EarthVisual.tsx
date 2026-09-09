import React, { useEffect, useRef, useMemo } from 'react';

// ─── Deterministic star PRNG ──────────────────────────────────────────────────
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface Star { id: number; top: number; left: number; r: number; opacity: number; }

function buildStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const r1 = seededRand(i * 137.508);
    const r2 = seededRand(i * 263.117 + 1);
    const r3 = seededRand(i * 419.221 + 2);
    const r4 = seededRand(i * 571.303 + 3);
    stars.push({
      id: i,
      top:     r1 * 100,
      left:    r2 * 100,
      r:       r3 > 0.93 ? 1.2 : r3 > 0.78 ? 0.85 : 0.55,
      opacity: 0.15 + r4 * 0.55,
    });
  }
  return stars;
}

// ─── EarthVisual ─────────────────────────────────────────────────────────────
export const EarthVisual: React.FC = () => {
  /**
   * Parallax — hover-only via window mousemove + bounding-rect check.
   *
   * We listen on window (so parent pointer-events:none never blocks us),
   * but we only apply displacement when the cursor is inside the Earth's
   * bounding rect. On leave we spring back to zero.
   */
  const outerRef    = useRef<HTMLDivElement>(null); // size / position ref
  const parallaxRef = useRef<HTMLDivElement>(null); // element that translates
  const targetRef   = useRef({ x: 0, y: 0 });
  const currentRef  = useRef({ x: 0, y: 0 });
  const rafRef      = useRef<number>(0);
  const insideRef   = useRef(false); // tracks hover state without re-renders

  const stars = useMemo(() => buildStars(160), []);

  useEffect(() => {
    const LERP = 0.06;

    // ── rAF lerp loop ────────────────────────────────────────────────────────
    const tick = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * LERP;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * LERP;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform =
          `translate3d(${currentRef.current.x.toFixed(2)}px, ${currentRef.current.y.toFixed(2)}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // ── Window-level mouse listener — hover determined by bounding rect ───
    const onMouseMove = (e: MouseEvent) => {
      const rect = outerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top  &&
        e.clientY <= rect.bottom;

      if (inside) {
        insideRef.current = true;
        // Normalize to −1 … +1 relative to Earth center
        const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
        targetRef.current = { x: nx * 13, y: ny * 10 };
      } else if (insideRef.current) {
        // Just left — spring back
        insideRef.current = false;
        targetRef.current = { x: 0, y: 0 };
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    /**
     * Outer div — pure size reference for bounding-rect. pointer-events:none
     * so it doesn't accidentally block clicks on text layered above the Earth.
     * Hover detection is done via window mousemove + getBoundingClientRect.
     */
    <div
      ref={outerRef}
      className="relative flex items-center justify-center select-none pointer-events-none"
      style={{ aspectRatio: '1 / 1', width: '100%', maxWidth: '520px' }}
    >
      {/* ── Sparse starfield ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {stars.map(s => (
          <span
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              top:     `${s.top}%`,
              left:    `${s.left}%`,
              width:   `${s.r * 2}px`,
              height:  `${s.r * 2}px`,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      {/* ── Parallax wrapper — only this element translates ──────────────── */}
      <div
        ref={parallaxRef}
        className="relative w-full h-full will-change-transform pointer-events-none"
      >
        {/* ── Outer soft space bloom ──────────────────────────────────────── */}
        <div
          className="absolute"
          style={{
            inset: '-6%',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 70% 28%, rgba(56,189,248,0.08) 50%, rgba(30,80,180,0.05) 70%, transparent 84%)',
            filter: 'blur(16px)',
          }}
          aria-hidden="true"
        />

        {/* ── Thin atmospheric limb glow on sunlit edge ───────────────────── */}
        <div
          className="absolute"
          style={{
            inset: '-1%',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 70% 27%, rgba(96,210,255,0.16) 60%, rgba(56,189,248,0.08) 72%, transparent 80%)',
            filter: 'blur(5px)',
            mixBlendMode: 'screen',
          }}
          aria-hidden="true"
        />

        {/* ── Earth photograph ─────────────────────────────────────────────── */}
        <img
          src="/textures/earth_hero.jpg"
          alt="Earth from orbit — Asia and India view"
          draggable={false}
          className="w-full h-full block"
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center center',
            boxShadow: [
              '0 0 0 1px rgba(56,189,248,0.05)',
              '0 0 45px 5px rgba(30,80,200,0.13)',
              '0 0 110px 25px rgba(8,16,50,0.35)',
            ].join(', '),
          }}
        />

        {/*
         * ── Physics-accurate day/night terminator shadow ─────────────────────
         *
         * Earth is centered in the viewport.
         * Sun direction: upper-right (≈ 88% 14% in screen-space).
         * Terminator = perpendicular great-circle to the sun vector.
         * Night hemisphere = left + lower-left of the Earth disk.
         *
         * Radial gradient from sun position → Lambert cosine falloff:
         *   transparent  : day side (sun-facing)
         *   twilight zone: 40–57 % of radial distance from sun
         *   deep night   : >60 % — near-opaque dark navy so baked city
         *                  lights in the base image still faintly read through.
         *
         * Left hemisphere is where hero text floats → shadow ≥ 0.88 alpha
         * so white text stays legible over the dark Earth.
         */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: '50%',
            background: `radial-gradient(
              ellipse 130% 130% at 88% 14%,
              transparent            0%,
              transparent           30%,
              rgba(0, 2, 14, 0.06)  40%,
              rgba(0, 2, 12, 0.28)  48%,
              rgba(0, 1, 10, 0.56)  57%,
              rgba(0, 1,  8, 0.76)  66%,
              rgba(0, 0,  6, 0.88)  76%,
              rgba(0, 0,  4, 0.94)  88%,
              rgba(0, 0,  3, 0.97) 100%
            )`,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};