import { RefreshCw, Trash2 } from 'lucide-react';
import type { SessionSummaryData } from '../types/vitals';

interface SessionSummaryScreenProps {
  summary: SessionSummaryData | null;
  onClearSession: () => void;
  onStartNewSession: () => void;
}

function computeStats(values: number[]) {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

export function SessionSummaryScreen({
  summary,
  onClearSession,
  onStartNewSession,
}: SessionSummaryScreenProps) {
  if (!summary) {
    return (
      <main className="mx-auto max-w-[760px] px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-slate-100">
          Session Cleared
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          All in-memory biometric samples from your session have been removed.
        </p>
        <button
          type="button"
          onClick={onStartNewSession}
          className="mt-8 rounded-xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-300"
        >
          Start New Session
        </button>
      </main>
    );
  }

  const pulseStats = computeStats(summary.pulseSamples.map((s) => s.value));
  const breathingStats = computeStats(
    summary.breathingSamples.map((s) => s.value),
  );
  const hrvStats = computeStats(summary.hrvSamples.map((s) => s.rmssd));

  const qualityRatio =
    summary.totalValidationPackets > 0
      ? Math.round(
          (summary.optimalValidationPackets / summary.totalValidationPackets) *
            100,
        )
      : null;

  // Deterministic radial visual footprint built from real session samples
  const ringPoints = summary.pulseSamples.slice(-48);

  return (
    <main className="mx-auto max-w-[1040px] px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-8">
        <div>
          <p className="text-xs font-medium text-sky-300">
            Session Complete
            {summary.source === 'demo' && (
              <>
                <span className="mx-2 text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-amber-300">DEMO DATA</span>
              </>
            )}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-50">
            Session Reflection Summary
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Camera stream released. Measurements are held in memory only until
            cleared.
          </p>
        </div>

        <div className="text-right">
          <span className="block text-xs text-slate-400">Duration</span>
          <span className="tabular-metric text-2xl font-semibold text-slate-100">
            {formatDuration(summary.durationSeconds)}
          </span>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* Session Visual Footprint */}
        <section className="glass-surface flex flex-col items-center justify-center rounded-2xl p-6 lg:col-span-5">
          <h2 className="self-start font-display text-sm font-semibold text-slate-200">
            Session Rhythm Footprint
          </h2>
          <div className="my-6 flex h-56 w-56 items-center justify-center">
            <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Visual rhythm summary of your session">
              <circle
                cx="100"
                cy="100"
                r="72"
                fill="none"
                stroke="rgba(56, 189, 248, 0.16)"
                strokeWidth="1"
              />
              <circle
                cx="100"
                cy="100"
                r="48"
                fill="none"
                stroke="rgba(129, 140, 248, 0.16)"
                strokeWidth="1"
              />
              {ringPoints.length > 2 ? (
                <polygon
                  fill="rgba(34, 211, 238, 0.12)"
                  stroke="#22D3EE"
                  strokeWidth="1.6"
                  points={ringPoints
                    .map((sample, idx) => {
                      const angle = (idx / ringPoints.length) * Math.PI * 2 - Math.PI / 2;
                      const norm = Math.min(1, Math.max(0.2, (sample.value - 45) / 65));
                      const radius = 42 + norm * 42;
                      const x = 100 + Math.cos(angle) * radius;
                      const y = 100 + Math.sin(angle) * radius;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ')}
                />
              ) : (
                <circle
                  cx="100"
                  cy="100"
                  r="36"
                  fill="rgba(56, 189, 248, 0.08)"
                  stroke="rgba(56, 189, 248, 0.35)"
                  strokeDasharray="4 4"
                />
              )}
            </svg>
          </div>
          <p className="text-center text-xs text-slate-400">
            {ringPoints.length > 2
              ? `Generated from ${summary.pulseSamples.length} validated pulse points and ${summary.breathingSamples.length} breathing points.`
              : 'Insufficient validated samples to plot a session ring.'}
          </p>
        </section>

        {/* Metrics Breakdown */}
        <section className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          <div className="glass-surface rounded-2xl p-5">
            <span className="text-xs text-slate-400">Pulse Measurements</span>
            {pulseStats ? (
              <>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="tabular-metric text-3xl font-semibold text-slate-50">
                    {pulseStats.avg.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    BPM avg
                  </span>
                </div>
                <p className="mt-2 tabular-metric text-xs text-slate-400">
                  Range {pulseStats.min.toFixed(0)}–{pulseStats.max.toFixed(0)}{' '}
                  BPM · {pulseStats.count} samples
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No stable pulse measurements recorded
              </p>
            )}
          </div>

          <div className="glass-surface rounded-2xl p-5">
            <span className="text-xs text-slate-400">
              Breathing Measurements
            </span>
            {breathingStats ? (
              <>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="tabular-metric text-3xl font-semibold text-slate-50">
                    {breathingStats.avg.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    BR/MIN avg
                  </span>
                </div>
                <p className="mt-2 tabular-metric text-xs text-slate-400">
                  Range {breathingStats.min.toFixed(1)}–
                  {breathingStats.max.toFixed(1)} · {breathingStats.count}{' '}
                  samples
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No stable breathing measurements recorded
              </p>
            )}
          </div>

          <div className="glass-surface rounded-2xl p-5">
            <span className="text-xs text-slate-400">
              Heart Rate Variability (HRV)
            </span>
            {hrvStats ? (
              <>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="tabular-metric text-3xl font-semibold text-slate-50">
                    {hrvStats.avg.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    ms RMSSD avg
                  </span>
                </div>
                <p className="mt-2 tabular-metric text-xs text-slate-400">
                  {hrvStats.count} valid HRV packets
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                HRV was not available during this session
              </p>
            )}
          </div>

          <div className="glass-surface rounded-2xl p-5">
            <span className="text-xs text-slate-400">Signal Quality Summary</span>
            {qualityRatio !== null ? (
              <>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="tabular-metric text-3xl font-semibold text-slate-50">
                    {qualityRatio}%
                  </span>
                  <span className="text-xs text-slate-400">optimal framing</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {summary.validationNotes.length > 0
                    ? `Notes: ${summary.validationNotes.slice(0, 2).join(', ')}`
                    : 'Consistent illumination and framing maintained.'}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No validation telemetry collected
              </p>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
        <p className="max-w-xl text-xs leading-relaxed text-slate-500">
          VITALFLOW provides observational wellness visualizations for personal
          mindfulness only. Measurements are not medical assessments or
          diagnoses.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClearSession}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear Session</span>
          </button>

          <button
            type="button"
            onClick={onStartNewSession}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-5 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-300 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Start New Session</span>
          </button>
        </div>
      </footer>
    </main>
  );
}
