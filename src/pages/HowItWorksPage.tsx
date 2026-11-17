import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { AppScreen } from '../types/vitals';

interface HowItWorksPageProps {
  onNavigate: (screen: AppScreen) => void;
  onStartExperience: () => void;
}

const STEPS = [
  {
    num: '01',
    title: 'Sit in front of the camera',
    body: 'Position yourself comfortably at arm’s length in front of your webcam or laptop screen.',
  },
  {
    num: '02',
    title: 'Ensure adequate lighting',
    body: 'Soft, even front-facing light helps optical sensing detect subtle facial blood-volume and chest motion signals.',
  },
  {
    num: '03',
    title: 'Position your face comfortably',
    body: 'Center your face and upper shoulders inside the preview guide and avoid strong backlighting.',
  },
  {
    num: '04',
    title: 'Start the measurement',
    body: 'Grant explicit camera permission and allow a brief calibration window while SmartSpectra locks onto stable signals.',
  },
  {
    num: '05',
    title: 'Watch the digital environment respond',
    body: 'Breathing cadence guides the garden’s expansion and contraction, pulse rhythm drives glowing particles, and HRV modulates complexity when available.',
  },
  {
    num: '06',
    title: 'Stop whenever you wish',
    body: 'Ending a session immediately stops processing, releases your camera, and presents a reflection summary you can clear anytime.',
  },
];

export function HowItWorksPage({
  onNavigate,
  onStartExperience,
}: HowItWorksPageProps) {
  return (
    <main className="mx-auto max-w-[1040px] px-6 py-12">
      <button
        type="button"
        onClick={() => onNavigate('welcome')}
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-100 whitespace-nowrap shrink-0"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Back to Experience</span>
      </button>

      <header className="mt-8 border-b border-slate-800/80 pb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
          How VITALFLOW Works
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
          VITALFLOW connects the Presage SmartSpectra SDK to a real-time
          generative canvas, turning natural human rhythms into calm visual
          motion.
        </p>
      </header>

      <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step) => (
          <article key={step.num} className="glass-surface rounded-2xl p-6">
            <span className="tabular-metric text-xs font-medium text-sky-400">
              Step {step.num}
            </span>
            <h2 className="mt-2 font-display text-base font-semibold text-slate-100">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {step.body}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-10 glass-surface rounded-2xl p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-slate-100">
          Signal-to-Environment Mapping
        </h2>
        <div className="mt-5 grid gap-6 border-t border-slate-800/80 pt-5 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-medium text-cyan-300">Breathing Rate</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Smoothed respiratory rate and chest traces drive the expansion and
              contraction of rings, petals, and wave horizons.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-sky-300">Pulse Rate</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Validated pulse cadence sets particle drift tempo and triggers
              expanding circular ripples across the canvas.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-indigo-300">
              HRV (When Available)
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              If SmartSpectra emits genuine HRV metrics, filament branching and
              mandala symmetry respond dynamically. Never inferred from pulse.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-amber-300">
              Signal Quality
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Lighting or framing warnings gently shift the garden into a
              calibration cue rather than displaying unreliable numbers.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onStartExperience}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-300 whitespace-nowrap shrink-0"
          >
            <span>Start Experience</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}
