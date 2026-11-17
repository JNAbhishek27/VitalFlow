import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Eye,
  KeyRound,
  Shield,
  Sun,
} from 'lucide-react';
import { CameraPreview } from '../components/CameraPreview';
import { setElectronSessionApiKey } from '../services/smartSpectraService';
import type {
  AppScreen,
  CameraStatus,
  DataSourceMode,
  ElectronRuntimeInfo,
  SdkErrorInfo,
  SdkLifecycleState,
  ValidationGuidance,
} from '../types/vitals';

interface ConsentSetupScreenProps {
  isElectron: boolean;
  electronInfo: ElectronRuntimeInfo | null;
  onRefreshElectronInfo: () => Promise<ElectronRuntimeInfo | null>;
  telemetryEnabled: boolean;
  onToggleTelemetry: (enabled: boolean) => void;
  cameraStream: MediaStream | null;
  cameraStatus: CameraStatus;
  cameraMessage: string;
  sdkStatus: SdkLifecycleState;
  validationGuidance: ValidationGuidance | null;
  errorInfo: SdkErrorInfo | null;
  dataSourceMode: DataSourceMode;
  onInitializeSetup: (
    mode: DataSourceMode,
    options?: { withCameraPreview?: boolean },
  ) => Promise<void>;
  onBeginMeasurement: () => void;
  onCancelSetup: () => Promise<void>;
  onNavigate: (screen: AppScreen) => void;
}

export function ConsentSetupScreen({
  isElectron,
  electronInfo,
  onRefreshElectronInfo,
  telemetryEnabled,
  onToggleTelemetry,
  cameraStream,
  cameraStatus,
  cameraMessage,
  sdkStatus,
  validationGuidance,
  errorInfo,
  dataSourceMode,
  onInitializeSetup,
  onBeginMeasurement,
  onCancelSetup,
  onNavigate,
}: ConsentSetupScreenProps) {
  const [consentChecked, setConsentChecked] = useState(false);
  const [setupActivated, setSetupActivated] = useState(false);
  const [sessionKeyInput, setSessionKeyInput] = useState('');
  const [keyStatusMessage, setKeyStatusMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const hasElectronApiKey = Boolean(electronInfo?.hasActiveApiKey);
  const isSdkReadyOrRunning =
    sdkStatus === 'running' ||
    sdkStatus === 'starting' ||
    cameraStatus === 'ready';

  const handleSaveSessionKey = async () => {
    const trimmed = sessionKeyInput.trim();
    if (!trimmed) {
      setKeyStatusMessage('Enter a valid Presage SmartSpectra API key.');
      return;
    }
    const saved = await setElectronSessionApiKey(trimmed);
    setSessionKeyInput('');
    await onRefreshElectronInfo();
    setKeyStatusMessage(
      saved
        ? 'Session API key stored in Electron main-process memory for this session.'
        : 'Could not save key.',
    );
  };

  const handleActivateSdk = async () => {
    if (!consentChecked) return;
    setIsInitializing(true);
    setSetupActivated(true);
    try {
      await onInitializeSetup('sdk');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleActivateDemo = async (withCamera: boolean) => {
    if (!consentChecked) return;
    setIsInitializing(true);
    setSetupActivated(true);
    try {
      await onInitializeSetup('demo', { withCameraPreview: withCamera });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCancel = async () => {
    setSetupActivated(false);
    await onCancelSetup();
    onNavigate('welcome');
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Cancel &amp; Return</span>
        </button>

        <span className="text-xs text-slate-400">
          Consent &amp; Camera Calibration
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left column: Consent, Privacy & SDK Initialization */}
        <section className="glass-surface rounded-2xl p-6 sm:p-8 lg:col-span-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-50">
            Camera Consent &amp; Sensing Setup
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Before activating your camera, please review how VITALFLOW and the
            Presage SmartSpectra SDK handle optical sensing.
          </p>

          <div className="mt-6 space-y-5 border-t border-slate-800/80 pt-6 text-sm">
            <div className="flex items-start gap-3">
              <Camera
                className="mt-0.5 h-4 w-4 shrink-0 text-sky-400"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-medium text-slate-100">
                  Why camera access is needed
                </h2>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  SmartSpectra analyzes subtle optical color shifts on your face
                  and micro-movements of your upper chest to sense breathing and
                  pulse cadence without wearable sensors.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Eye
                className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-medium text-slate-100">
                  Signals requested from SmartSpectra
                </h2>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  Breathing rate &amp; chest/abdomen motion traces, pulse rate
                  &amp; arterial pressure trace, and Heart Rate Variability (HRV)
                  only when stable signal quality supports it.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield
                className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-medium text-slate-100">
                  Privacy &amp; in-memory handling
                </h2>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  Video is never recorded or saved. Session readings stay in
                  memory and clear when you finish or delete your session.
                </p>
              </div>
            </div>
          </div>

          {/* SDK Telemetry opt-out control */}
          <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <div>
                <span className="block text-sm font-medium text-slate-200">
                  SmartSpectra Diagnostic Telemetry
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                  When enabled, the SDK may send aggregate session diagnostics
                  (never raw video frames or vital sign measurements).
                </span>
              </div>
              <input
                type="checkbox"
                checked={!telemetryEnabled}
                onChange={(e) => onToggleTelemetry(!e.target.checked)}
                className="mt-1 h-4 w-4 accent-sky-400"
              />
            </label>
            <p className="mt-2 text-xs text-slate-400">
              {telemetryEnabled
                ? 'Aggregate SDK diagnostics enabled.'
                : 'Telemetry disabled (enableTelemetry: false).'}
            </p>
          </div>

          {/* Electron API key prompt if running in Electron without env key */}
          {isElectron && !hasElectronApiKey && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                <span>Presage API Key Required for Electron SDK</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Set <code className="font-mono text-amber-200">SMARTSPECTRA_API_KEY</code> in{' '}
                <code className="font-mono text-amber-200">.env</code> or enter a key
                in memory for this desktop session.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="password"
                  value={sessionKeyInput}
                  onChange={(e) => setSessionKeyInput(e.target.value)}
                  placeholder="Enter Presage SmartSpectra API key"
                  aria-label="Presage SmartSpectra API key"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveSessionKey}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700 whitespace-nowrap shrink-0"
                >
                  Apply Key
                </button>
              </div>
              {keyStatusMessage && (
                <p className="mt-2 text-xs text-sky-300">{keyStatusMessage}</p>
              )}
            </div>
          )}

          {/* Browser preview notice when Electron IPC bridge isn't available */}
          {!isElectron && (
            <div className="mt-5 rounded-xl border border-sky-500/25 bg-sky-950/20 p-4">
              <p className="text-xs font-semibold text-sky-300">
                Browser Preview Environment Detected
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                The native Presage SmartSpectra C++ runtime runs inside the
                Electron desktop app (<code className="font-mono">npm run electron:start</code>).
                Here in the browser preview, you can test live camera framing
                together with an explicitly labeled{' '}
                <strong className="text-slate-100">DEMO DATA</strong> signal
                pipeline.
              </p>
            </div>
          )}

          {/* Explicit consent checkbox */}
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-sky-400"
            />
            <span className="text-xs leading-relaxed text-slate-200">
              I consent to temporary camera access for real-time optical
              wellness visualization. I understand VITALFLOW is not a medical
              device and does not diagnose or treat any condition.
            </span>
          </label>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isElectron ? (
              <button
                type="button"
                disabled={!consentChecked || isInitializing || !hasElectronApiKey}
                onClick={handleActivateSdk}
                className="rounded-xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
              >
                {isInitializing
                  ? 'Initializing SmartSpectra...'
                  : 'Grant Permission & Initialize SDK'}
              </button>
            ) : (
              <button
                type="button"
                disabled={!consentChecked || isInitializing}
                onClick={() => handleActivateDemo(true)}
                className="rounded-xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
              >
                {isInitializing
                  ? 'Starting Preview...'
                  : 'Allow Camera & Preview (Demo Data)'}
              </button>
            )}

            <button
              type="button"
              disabled={!consentChecked || isInitializing}
              onClick={() => handleActivateDemo(false)}
              className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              Demo Mode Without Camera
            </button>
          </div>

          {errorInfo && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-rose-500/35 bg-rose-950/25 p-4 text-xs"
            >
              <div className="flex items-center gap-2 font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorInfo.message}</span>
              </div>
              <p className="mt-1.5 leading-relaxed text-slate-300">
                {errorInfo.recoveryHint}
              </p>
            </div>
          )}
        </section>

        {/* Right column: Camera Preview & Readiness Guidance (no fabricated metrics!) */}
        <section className="glass-surface flex flex-col justify-between rounded-2xl p-6 sm:p-8 lg:col-span-6">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-semibold text-slate-100">
                Camera Preview &amp; Readiness
              </h2>
              <span className="tabular-metric text-xs text-slate-400">
                SDK: {sdkStatus}
              </span>
            </div>

            <div className="mt-4">
              <CameraPreview
                stream={cameraStream}
                cameraStatus={cameraStatus}
                showGuideOverlay
              />
            </div>

            <p className="mt-3 text-xs text-slate-400">{cameraMessage}</p>

            {/* Real-time readiness status grid */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/45 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Sun className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                  <span>Lighting Guidance</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {validationGuidance
                    ? validationGuidance.lightingStatus === 'good'
                      ? 'Lighting appears balanced on your face.'
                      : validationGuidance.guidance
                    : 'Use even, soft front lighting and avoid strong windows behind you.'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/45 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-cyan-400"
                    aria-hidden="true"
                  />
                  <span>Positioning Guidance</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {validationGuidance
                    ? validationGuidance.title
                    : 'Sit comfortably arm’s length from the camera with face and upper shoulders visible.'}
                </p>
              </div>
            </div>

            {validationGuidance && (
              <div
                className={`mt-4 rounded-xl border p-4 text-xs ${
                  validationGuidance.severity === 'optimal'
                    ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-200'
                    : validationGuidance.severity === 'blocked'
                      ? 'border-rose-500/30 bg-rose-950/20 text-rose-200'
                      : 'border-amber-500/30 bg-amber-950/20 text-amber-200'
                }`}
              >
                <span className="font-semibold">
                  Signal Quality: {validationGuidance.title}
                </span>
                <span className="mx-2 opacity-50" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-300">
                  {validationGuidance.guidance}
                </span>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
            <span className="text-xs text-slate-400">
              {setupActivated && dataSourceMode === 'demo'
                ? 'DEMO DATA pipeline armed'
                : setupActivated
                  ? 'Real SmartSpectra pipeline armed'
                  : 'Complete consent to initialize'}
            </span>

            <button
              type="button"
              disabled={!setupActivated || !isSdkReadyOrRunning}
              onClick={onBeginMeasurement}
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              Start Measurement
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
