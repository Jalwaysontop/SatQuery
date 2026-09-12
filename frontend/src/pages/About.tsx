import React, { useEffect, useRef } from 'react';
import {
  Satellite,
  Brain,
  GitCompare,
  Radio,
  Zap,
  ShieldCheck,
  Globe2,
  ChevronRight,
  Layers,
  TreePine,
  Waves,
  AlertTriangle,
  Wheat,
} from 'lucide-react';

// ─── tiny hook: animate a number counting up ────────────────────────────────
function useCountUp(target: number, duration = 1800) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (ref.current) ref.current.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { start = null; requestAnimationFrame(step); obs.disconnect(); } },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return ref;
}

// ─── reusable animated section wrapper ──────────────────────────────────────
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref} className={className}>{children}</div>;
};

// ─── stat card ──────────────────────────────────────────────────────────────
const Stat: React.FC<{ value: number; suffix?: string; label: string }> = ({ value, suffix = '', label }) => {
  const ref = useCountUp(value);
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm">
      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
        <span ref={ref}>0</span>{suffix}
      </span>
      <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 text-center">{label}</span>
    </div>
  );
};

// ─── capability card ─────────────────────────────────────────────────────────
interface CapabilityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  border: string;
  glow: string;
}
const CapabilityCard: React.FC<CapabilityCardProps> = ({ icon, title, description, color, border, glow }) => (
  <div className={`group relative flex flex-col gap-4 p-6 rounded-2xl bg-[#080e1f] border ${border} hover:${glow} transition-all duration-500 hover:-translate-y-1 overflow-hidden`}>
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl ${glow} blur-xl`} />
    <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
      {icon}
    </div>
    <div className="relative">
      <h3 className="font-semibold text-white mb-1.5 text-[15px]">{title}</h3>
      <p className="text-slate-400 text-[13px] leading-relaxed">{description}</p>
    </div>
  </div>
);

// ─── how-it-works step ───────────────────────────────────────────────────────
const Step: React.FC<{ n: number; title: string; body: string; accent: string }> = ({ n, title, body, accent }) => (
  <div className="flex gap-5 items-start">
    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${accent} ring-1 ring-white/10`}>
      {n}
    </div>
    <div className="pt-1.5">
      <h4 className="font-semibold text-white text-[14px] mb-1">{title}</h4>
      <p className="text-slate-400 text-[13px] leading-relaxed">{body}</p>
    </div>
  </div>
);

// ─── domain badge ─────────────────────────────────────────────────────────────
const DomainBadge: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[13px] text-slate-300 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-300 transition-all duration-300 cursor-default">
    <span className="text-blue-400">{icon}</span>
    {label}
  </div>
);

// ─── About Page ──────────────────────────────────────────────────────────────
export const About: React.FC = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto px-5 sm:px-8 py-10 space-y-24 text-slate-100">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <FadeIn>
        <div className="text-center space-y-5">
          {/* eyebrow pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-mono font-semibold tracking-wider uppercase">
            <Satellite className="w-3.5 h-3.5" />
            SIH 2026 — Remote Sensing Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            The Earth in Your{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-base sm:text-lg leading-relaxed">
            SatQuery AI is a multimodal remote-sensing intelligence system that lets you ask
            natural-language questions about satellite imagery — and get accurate, explainable answers back.
          </p>

          {/* stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 pt-4">
            <Stat value={3} suffix="+" label="Sensor Types Fused" />
            <Stat value={5} suffix="+" label="Specialized Models" />
            <Stat value={100} suffix="%" label="Confidence Scored" />
            <Stat value={1} suffix="" label="Platform · All Domains" />
          </div>
        </div>
      </FadeIn>

      {/* ── PROBLEM STATEMENT ─────────────────────────────────────────────── */}
      <FadeIn delay={60}>
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Problem Statement</h2>
          </div>

          <div className="relative pl-6 border-l-2 border-red-500/30 space-y-5">
            {[
              {
                heading: 'Data without answers',
                body: 'Satellite and aerial imagery — optical, multispectral, and radar (SAR) — is being captured at massive scale, but extracting meaningful insight still requires domain experts and specialized GIS tools most organizations don\'t have.'
              },
              {
                heading: 'Generic AI falls short',
                body: 'Existing vision-language models are trained on everyday photos, not top-down remote-sensing data. They perform poorly on land-use classification, change detection, or multi-sensor fusion tasks, making them unreliable for real geospatial work.'
              },
              {
                heading: 'No accessible interface',
                body: 'There is no accessible way for a non-expert to simply ask a question about a satellite image and get a reliable, evidence-backed answer. The gap between satellite data and actionable insight remains wide.'
              }
            ].map(({ heading, body }) => (
              <div key={heading}>
                <p className="text-white font-semibold text-[14px] mb-1">
                  <ChevronRight className="w-3.5 h-3.5 text-red-400 inline mr-1" />
                  {heading}
                </p>
                <p className="text-slate-400 text-[13px] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── OBJECTIVE / CAPABILITIES ──────────────────────────────────────── */}
      <FadeIn delay={80}>
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Our Objective</h2>
          </div>
          <p className="text-slate-400 text-[14px] leading-relaxed max-w-3xl">
            SatQuery AI closes the gap between satellite data and human understanding by building an
            agentic, multimodal system purpose-built for remote sensing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <CapabilityCard
              icon={<Satellite className="w-5 h-5 text-blue-300" />}
              title="Visual Question Answering"
              description="Understand a single satellite image through VQA, captioning, and grounding — identifying what's in the scene and where."
              color="bg-blue-500/10 border border-blue-500/20"
              border="border-slate-800"
              glow="shadow-blue-500/10"
            />
            <CapabilityCard
              icon={<GitCompare className="w-5 h-5 text-emerald-300" />}
              title="Change Detection"
              description="Compare two images of the same location across time to detect and explain real-world change — urban growth, deforestation, flood extent."
              color="bg-emerald-500/10 border border-emerald-500/20"
              border="border-slate-800"
              glow="shadow-emerald-500/10"
            />
            <CapabilityCard
              icon={<Radio className="w-5 h-5 text-purple-300" />}
              title="Optical + SAR Fusion"
              description="Fuse optical and SAR imagery to answer questions neither sensor could fully answer alone — seeing through clouds, detecting floods, structural change."
              color="bg-purple-500/10 border border-purple-500/20"
              border="border-slate-800"
              glow="shadow-purple-500/10"
            />
            <CapabilityCard
              icon={<Zap className="w-5 h-5 text-amber-300" />}
              title="Agentic Model Routing"
              description="Automatically route each question to the right specialized model fine-tuned on satellite data — rather than relying on one generic model to do everything."
              color="bg-amber-500/10 border border-amber-500/20"
              border="border-slate-800"
              glow="shadow-amber-500/10"
            />
            <CapabilityCard
              icon={<ShieldCheck className="w-5 h-5 text-cyan-300" />}
              title="Confidence & Evidence"
              description="Every answer is backed by a confidence score and visual evidence — which model was used, how confident it is, and where in the image the evidence lies."
              color="bg-cyan-500/10 border border-cyan-500/20"
              border="border-slate-800"
              glow="shadow-cyan-500/10"
            />
            <CapabilityCard
              icon={<Globe2 className="w-5 h-5 text-sky-300" />}
              title="Plain Language Interface"
              description="Ask questions in natural language. No GIS background required — SatQuery translates your intent into the right query on the right model."
              color="bg-sky-500/10 border border-sky-500/20"
              border="border-slate-800"
              glow="shadow-sky-500/10"
            />
          </div>
        </section>
      </FadeIn>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <FadeIn delay={80}>
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* left: steps */}
            <div className="space-y-7 py-2">
              <Step
                n={1}
                accent="bg-blue-500/20 text-blue-300"
                title="Upload your imagery"
                body="Drag in a single satellite image, a before/after pair, or a multi-sensor stack (optical + SAR). SatQuery detects sensor type, resolution, and temporal context automatically."
              />
              <Step
                n={2}
                accent="bg-cyan-500/20 text-cyan-300"
                title="Ask your question"
                body='Type your question in plain language — "What land-use classes are present?", "How much did the urban area grow?", "Is this flooded compared to last month?" — no geospatial jargon needed.'
              />
              <Step
                n={3}
                accent="bg-indigo-500/20 text-indigo-300"
                title="Agentic controller dispatches"
                body="The agentic controller reads your question, validates that the uploaded imagery matches the task (single-image, time-series, or multi-sensor), then dispatches to the correct specialist model."
              />
              <Step
                n={4}
                accent="bg-purple-500/20 text-purple-300"
                title="Specialist model responds"
                body="A model fine-tuned specifically on satellite data — not generic photos — processes your query and generates an answer grounded in the actual pixel evidence."
              />
              <Step
                n={5}
                accent="bg-emerald-500/20 text-emerald-300"
                title="Transparent, evidence-backed answer"
                body="You receive a clear answer alongside the reasoning: model used, confidence score, and a visual grounding overlay highlighting where in the image the evidence was found."
              />
            </div>

            {/* right: architecture diagram (CSS-only) */}
            <div className="relative flex flex-col gap-2.5 p-6 rounded-2xl bg-[#060c1a] border border-slate-800/60 font-mono text-xs overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">System Architecture</p>

              {/* boxes */}
              {[
                { label: 'Natural Language Query', bg: 'bg-slate-800/70', text: 'text-slate-300', border: 'border-slate-700/50' },
                { label: '↓ Agentic Controller', bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/25' },
                { label: '↓ Task Router', bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500/25' },
              ].map(({ label, bg, text, border }) => (
                <div key={label} className={`px-4 py-2.5 rounded-xl ${bg} border ${border} ${text}`}>{label}</div>
              ))}

              {/* three specialist models */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { label: 'VQA\nModel', color: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
                  { label: 'Change\nDetect', color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  { label: 'SAR\nFusion', color: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                ].map(({ label, color, bg, border }) => (
                  <div key={label} className={`flex flex-col items-center justify-center px-2 py-3 rounded-xl ${bg} border ${border} ${color} text-center leading-snug`}>
                    {label.split('\n').map((l, i) => <span key={i}>{l}</span>)}
                  </div>
                ))}
              </div>

              <div className={`px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 mt-1`}>
                ↓ Confidence Score + Evidence
              </div>
              <div className={`px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300`}>
                ↓ Answer Delivered to User
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── WHY IT MATTERS ─────────────────────────────────────────────────── */}
      <FadeIn delay={60}>
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Globe2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Why It Matters</h2>
          </div>

          <p className="text-slate-400 text-[14px] leading-relaxed max-w-3xl">
            Remote sensing already touches critical domains — agriculture, climate, disaster response, and urban planning.
            SatQuery AI makes that data queryable in plain language, turning satellite imagery from something only
            specialists can interpret into something <span className="text-white font-medium">anyone can simply ask about</span>.
          </p>

          <div className="flex flex-wrap gap-3 mt-2">
            <DomainBadge icon={<TreePine className="w-3.5 h-3.5" />} label="Deforestation Monitoring" />
            <DomainBadge icon={<Waves className="w-3.5 h-3.5" />} label="Flood Mapping" />
            <DomainBadge icon={<Globe2 className="w-3.5 h-3.5" />} label="Urban Growth Tracking" />
            <DomainBadge icon={<Wheat className="w-3.5 h-3.5" />} label="Crop & Agriculture" />
            <DomainBadge icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Disaster Assessment" />
            <DomainBadge icon={<Radio className="w-3.5 h-3.5" />} label="SAR Analysis" />
          </div>
        </section>
      </FadeIn>

      {/* ── CALL TO ACTION ────────────────────────────────────────────────── */}
      <FadeIn delay={60}>
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent p-10 text-center space-y-5">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <p className="text-[11px] font-mono uppercase tracking-widest text-blue-400">Start Querying</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Ask your first question about Earth
          </h2>
          <p className="text-slate-400 text-[14px] max-w-lg mx-auto">
            Upload a satellite image, type your question, and let SatQuery's specialized models deliver
            a transparent, evidence-backed answer.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            <Satellite className="w-4 h-4" />
            Launch SatQuery
          </a>
        </div>
      </FadeIn>

    </div>
  );
};

export default About;
