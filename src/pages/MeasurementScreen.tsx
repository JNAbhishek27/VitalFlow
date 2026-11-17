import {
  AlertTriangle,
  Flower2,
  RotateCcw,
  Sparkles,
  Square,
  Waves,
} from 'lucide-react';
import { CameraPreview } from '../components/CameraPreview';
import { DigitalGardenCanvas } from '../components/DigitalGardenCanvas';
import { TraceSparkline } from '../components/TraceSparkline';
import type { SignalProcessor } from '../services/signalProcessor';
import type {
  CameraStatus,
  DataSourceMode,
  EnvironmentTheme,
  RawBiometricSnapshot,
  SdkErrorInfo,
  SdkLifecycleState,
  ValidationGuidance,
} from '../types/vitals';

interface MeasurementScreenProps {
  dataSourceMode: DataSourceMode;
  environmentTheme: EnvironmentTheme;
  onChangeEnvironment: (theme: EnvironmentTheme) => void;
  cameraStream: MediaStream | null;
  cameraStatus: CameraStatus;
  cameraMessage: string;
  sdkStatus: SdkLifecycleState;
  validationGuidance: ValidationGuidance | null;
  rawMetrics: RawBiometricSnapshot | null;
  errorInfo: SdkErrorInfo | null;
  elapsedSeconds: number;
  processor: SignalProcessor;
  onStopSession: () => void;
  onRestartSession: () => void;
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function MeasurementScreen({
  dataSourceMode,
  environmentTheme,
  onChangeEnvironment,
  cameraStream,
  cameraStatus,
  cameraMessage,
  sdkStatus,
  validationGuidance,
  rawMetrics,
  errorInfo,
  elapsedSeconds,
  processor,
  onStopSession,
  onRestartSession,
}: MeasurementScreenProps) {
  const hasPulse =
    rawMetrics?.pulseBpm !== null && rawMetrics?.pulseBpm !== undefined;
  const hasBreathing =
    rawMetrics?.breathingRate !== null &&
    rawMetrics?.breathingRate !== undefined;
  const hasHrv =
    rawMetrics?.hrvRmssd !== null && rawMetrics?.hrvRmssd !== undefined;

  const isCalibrating = !hasPulse && !hasBreathing && sdkStatus === 'running';

  const environments: {
    id: EnvironmentTheme;
    label: string;
    icon: typeof Flower2;
  }[] = [
    { id: 'living-garden', label: 'Living Garden', icon: Flower2 },
    { id: 'cosmic-waves', label: 'Cosmic Waves', icon: Waves },
    { id: 'breathing-mandala', label: 'Breathing Mandala', icon: Sparkles },
  ];

  const qualityLabel = validationGuidance
    ? validationGuidance.severity === 'optimal'
      ? 'Optimal'
      : validationGuidance.severity === 'adjust'
        ? 'Adjust Framing'
        : validationGuidance.severity === 'blocked'
          ? 'Signal Blocked'
          : 'Calibrating'
    : 'Initializing';

  const qualityColorClass =
    validationGuidance?.severity === 'optimal'
      ? 'text-cyan-300'
      : validationGuidance?.severity === 'blocked'
        ? 'text-rose-300'
        : validationGuidance?.severity === 'adjust'
          ? 'text-amber-300'
          : 'text-slate-300';

  return (
    <div className="relative min-h-[calc(100vh-61px)] w-full overflow-x-hidden bg-[#040711] lg:h-[calc(100vh-61px)] lg:overflow-hidden">
      {/* Full-viewport interactive HTML Canvas environment */}
      <div className="absolute inset-0">
        <DigitalGardenCanvas
          theme={environmentTheme}
          rawMetrics={rawMetrics}
          validationGuidance={validationGuidance}
          processor={processor}
        />
      </div>

      {/* Foreground HUD Grid */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-between gap-4 p-4 sm:p-6 lg:grid lg:grid-cols-12 lg:items-stretch">
        {/* LEFT COLUMN: Camera preview, status, quality, session timer */}
        <aside className="flex flex-col justify-between gap-4 lg:col-span-3">
          <div className="glass-surface rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-200">
                Camera Feed
              </span>
              <span className="tabular-metric text-xs text-slate-400">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>

            <CameraPreview
              stream={cameraStream}
              cameraStatus={cameraStatus}
              showGuideOverlay
              compact
            />

            <div className="mt-3.5 space-y-2.5 border-t border-slate-800/70 pt-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Camera</span>
                <span className="text-right text-slate-200 capitalize">
                  {cameraStatus}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Signal Quality</span>
                <span className={`font-medium ${qualityColorClass}`}>
                  {qualityLabel}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                {validationGuidance?.guidance ?? cameraMessage}
              </p>
            </div>
          </div>

          {/* Environment Theme Switcher */}
          <div className="glass-surface rounded-2xl p-3">
            <p className="mb-2 px-1 text-xs font-medium text-slate-400">
              Visual Environment
            </p>
            <div className="flex flex-col gap-1" role="radiogroup" aria-label="Visual environment selector">
              {environments.map((env) => {
                const Icon = env.icon;
                const active = environmentTheme === env.id;
                return (
                  <button
                    key={env.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChangeEnvironment(env.id)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{env.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* CENTER STAGE: Clean open canvas view with subtle calibration banner if needed */}
        <main className="pointer-events-none flex flex-col items-center justify-between py-2 lg:col-span-6">
          {dataSourceMode === 'demo' ? (
            <div className="pointer-events-auto glass-surface-subtle rounded-xl px-4 py-2 text-xs text-amber-200 border border-amber-500/30">
              DEMO DATA
              <span className="mx-2 text-slate-500" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-300">
                Simulated signal stream (run Electron app for real SmartSpectra SDK)
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-col items-center gap-2 text-center">
            {isCalibrating && (
              <div className="glass-surface-subtle rounded-xl px-4 py-2.5 text-xs text-slate-200">
                Measurement in progress — waiting for SmartSpectra to lock onto stable signals
              </div>
            )}

            {validationGuidance &&
              validationGuidance.severity !== 'optimal' && (
                <div className="glass-surface-subtle flex items-center gap-2 rounded-xl border border-amber-500/35 px-4 py-2 text-xs text-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {validationGuidance.title}: {validationGuidance.guidance}
                  </span>
                </div>
              )}

            {errorInfo && (
              <div
                role="alert"
                className="pointer-events-auto glass-surface rounded-xl border border-rose-500/40 px-4 py-3 text-xs text-rose-200"
              >
                <p className="font-semibold">{errorInfo.message}</p>
                <p className="mt-1 text-slate-300">{errorInfo.recoveryHint}</p>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Live Metrics & Session Controls */}
        <aside className="flex flex-col justify-between gap-4 lg:col-span-3">
          <div className="glass-surface space-y-4 rounded-2xl p-4">
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
              <div className="flex items-center gap-2">
                {sdkStatus === 'running' && (
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-cyan-400"
                  />
                )}
                <span className="text-xs font-medium text-slate-200">
                  {dataSourceMode === 'demo' ? 'DEMO DATA Readings' : 'Live Sensing'}
                </span>
              </div>
              <span className="text-xs text-slate-400 capitalize">
                {sdkStatus}
              </span>
            </div>

            {/* Pulse Rate */}
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Pulse Rate</span>
                {hasPulse && (
                  <span className="tabular-metric text-[11px] text-slate-400">
                    {rawMetrics?.pulseStable ? 'Stable' : 'Settling'}
                    {rawMetrics?.pulseConfidence !== null &&
                    rawMetrics?.pulseConfidence !== undefined
                      ? ` · ${Math.round(rawMetrics.pulseConfidence)}% conf`
                      : ''}
                  </span>
                )}
              </div>
              {hasPulse ? (
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="tabular-metric text-3xl font-semibold text-slate-50">
                    {Math.round(rawMetrics!.pulseBpm!)}
                  </span>
                  <span className="font-mono text-xs text-slate-400">BPM</span>
                </div>
              ) : (
                <p className="mt-1.5 text-sm text-slate-500">
                  Unavailable — measuring
                </p>
              )}
              <div className="mt-2">
                <TraceSparkline
                  values={rawMetrics?.arterialTrace ?? []}
                  strokeColor="#38BDF8"
                  height={34}
                  label="Pulse"
                />
              </div>
            </div>

            {/* Breathing Rate */}
            <div className="border-t border-slate-800/70 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Breathing Rate</span>
                {hasBreathing && (
                  <span className="tabular-metric text-[11px] text-slate-400">
                    {rawMetrics?.breathingStable ? 'Stable' : 'Settling'}
                    {rawMetrics?.breathingConfidence !== null &&
                    rawMetrics?.breathingConfidence !== undefined
                      ? ` · ${Math.round(rawMetrics.breathingConfidence)}% conf`
                      : ''}
                  </span>
                )}
              </div>
              {hasBreathing ? (
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="tabular-metric text-3xl font-semibold text-slate-50">
                    {rawMetrics!.breathingRate!.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-slate-400">BR/MIN</span>
                </div>
              ) : (
                <p className="mt-1.5 text-sm text-slate-500">
                  Unavailable — measuring
                </p>
              )}
              <div className="mt-2">
                <TraceSparkline
                  values={rawMetrics?.upperBreathingTrace ?? []}
                  strokeColor="#22D3EE"
                  height={34}
                  label="Breathing"
                />
              </div>
            </div>

            {/* HRV — Strictly shown ONLY when genuinely available */}
            <div className="border-t border-slate-800/70 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">
                  Heart Rate Variability
                </span>
                {hasHrv && (
                  <span className="tabular-metric text-[11px] text-indigo-300">
                    {rawMetrics?.hrvStable ? 'Valid' : 'Settling'}
                  </span>
                )}
              </div>
              {hasHrv ? (
                <div className="mt-1 flex items-baseline gap-4">
                  <div>
                    <span className="tabular-metric text-2xl font-semibold text-slate-50">
                      {Math.round(rawMetrics!.hrvRmssd!)}
                    </span>
                    <span className="ml-1 font-mono text-xs text-slate-400">
                      ms RMSSD
                    </span>
                  </div>
                  {rawMetrics?.hrvSdnn !== null &&
                    rawMetrics?.hrvSdnn !== undefined && (
                      <div className="tabular-metric text-xs text-slate-400">
                        SDNN {Math.round(rawMetrics.hrvSdnn)} ms
                      </div>
                    )}
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">
                  Unavailable (requires sustained stable cardiac window)
                </p>
              )}
            </div>
          </div>

          {/* Session Action Controls */}
          <div className="glass-surface flex items-center gap-2 rounded-2xl p-3">
            <button
              type="button"
              onClick={onRestartSession}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Restart</span>
            </button>

            <button
              type="button"
              onClick={onStopSession}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-400 px-3 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-300 whitespace-nowrap shrink-0"
            >
              <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>Stop Session</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
