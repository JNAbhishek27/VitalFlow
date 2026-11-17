import { ArrowLeft, EyeOff, HardDrive, Lock, Radio } from 'lucide-react';
import type { AppScreen } from '../types/vitals';

interface PrivacyPageProps {
  telemetryEnabled: boolean;
  onToggleTelemetry: (enabled: boolean) => void;
  onClearSession: () => void;
  onNavigate: (screen: AppScreen) => void;
}

export function PrivacyPage({
  telemetryEnabled,
  onToggleTelemetry,
  onClearSession,
  onNavigate,
}: PrivacyPageProps) {
  return (
    <main className="mx-auto max-w-[960px] px-6 py-12">
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
          Privacy &amp; Responsible Sensing
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
          VITALFLOW is built for calm self-awareness, not surveillance. Camera
          access, signal processing, and telemetry are transparent and under
          your control at every moment.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="glass-surface rounded-2xl p-6">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <Lock className="h-4 w-4 text-sky-400" aria-hidden="true" />
            <h2>Explicit Permission Only</h2>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
            Your camera remains completely inactive until you review consent and
            explicitly start a setup or measurement session. Background or covert
            monitoring never occurs.
          </p>
        </article>

        <article className="glass-surface rounded-2xl p-6">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <EyeOff className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            <h2>Zero Video Recording</h2>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
            Raw camera frames are processed transiently in memory to extract
            optical physiological signals. VITALFLOW never records, saves, or
            uploads video clips to external AI services.
          </p>
        </article>

        <article className="glass-surface rounded-2xl p-6">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <HardDrive className="h-4 w-4 text-indigo-400" aria-hidden="true" />
            <h2>Ephemeral In-Memory Sessions</h2>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
            Measurements stay strictly in volatile application memory during your
            session and summary. You can wipe them immediately with a single
            click or by closing the app.
          </p>
          <button
            type="button"
            onClick={onClearSession}
            className="mt-4 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
          >
            Clear In-Memory Session Data
          </button>
        </article>

        <article className="glass-surface rounded-2xl p-6">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <Radio className="h-4 w-4 text-sky-400" aria-hidden="true" />
            <h2>SmartSpectra SDK Telemetry</h2>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
            Per Presage SmartSpectra documentation, SDK telemetry may transmit
            aggregate session diagnostics and readiness summaries. Raw camera
            frames and measured vital values are never sent in telemetry.
          </p>
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
            <span className="text-xs font-medium text-slate-200">
              Disable SDK Telemetry (<code className="font-mono">enableTelemetry: false</code>)
            </span>
            <input
              type="checkbox"
              checked={!telemetryEnabled}
              onChange={(e) => onToggleTelemetry(!e.target.checked)}
              className="h-4 w-4 accent-sky-400"
            />
          </label>
        </article>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-6">
        <h2 className="font-display text-base font-semibold text-slate-100">
          Wellness &amp; Non-Medical Boundary
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          VITALFLOW is an interactive visual wellness and self-awareness
          experience. It is not a medical device and must not be used for
          clinical diagnosis, screening, treatment, or health risk evaluation.
        </p>
      </section>
    </main>
  );
}
