export type AppScreen =
  | 'welcome'
  | 'consent'
  | 'measurement'
  | 'summary'
  | 'privacy'
  | 'how-it-works';

export type EnvironmentTheme =
  | 'living-garden'
  | 'cosmic-waves'
  | 'breathing-mandala';

export type DataSourceMode = 'sdk' | 'demo';

export type SdkLifecycleState =
  | 'uninitialized'
  | 'idle'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error';

export type CameraStatus =
  | 'inactive'
  | 'requesting'
  | 'ready'
  | 'denied'
  | 'unavailable'
  | 'error';

export type ValidationSeverity = 'optimal' | 'adjust' | 'blocked' | 'unknown';

export interface ValidationGuidance {
  code: number;
  severity: ValidationSeverity;
  title: string;
  guidance: string;
  lightingStatus: 'good' | 'too-dark' | 'too-bright' | 'unknown';
  positioningStatus: 'centered' | 'adjust' | 'not-detected' | 'unknown';
  timestampUs: number | null;
}

export interface RawBiometricSnapshot {
  source: DataSourceMode;
  pulseBpm: number | null;
  pulseConfidence: number | null;
  pulseStable: boolean;
  breathingRate: number | null;
  breathingConfidence: number | null;
  breathingStable: boolean;
  hrvRmssd: number | null;
  hrvSdnn: number | null;
  hrvConfidence: number | null;
  hrvStable: boolean;
  upperBreathingTrace: number[];
  lowerBreathingTrace: number[];
  arterialTrace: number[];
  lastPacketTimestampUs: number | null;
}

export interface GardenVisualState {
  breathPhase: number;
  breathExpansion: number;
  pulsePhase: number;
  pulseRipple: number;
  pulseCadenceBpm: number;
  breathingCadenceRpm: number;
  complexity: number;
  stability: number;
  isActiveSignal: boolean;
  isQualityWarning: boolean;
  hrvModulated: boolean;
}

export interface MetricSample {
  timestampMs: number;
  value: number;
  confidence: number;
  stable: boolean;
}

export interface HrvSample {
  timestampMs: number;
  rmssd: number;
  sdnn: number;
  confidence: number;
  stable: boolean;
}

export interface SessionSummaryData {
  startedAtMs: number;
  endedAtMs: number;
  durationSeconds: number;
  source: DataSourceMode;
  pulseSamples: MetricSample[];
  breathingSamples: MetricSample[];
  hrvSamples: HrvSample[];
  totalValidationPackets: number;
  optimalValidationPackets: number;
  validationNotes: string[];
}

export interface SdkErrorInfo {
  code: number;
  message: string;
  retryable: boolean;
  recoveryHint: string;
}

export interface ElectronRuntimeInfo {
  isElectron: boolean;
  hasEnvApiKey: boolean;
  hasSessionApiKey: boolean;
  hasActiveApiKey: boolean;
  cameraConsentGranted: boolean;
  nodeVersion: string;
  electronVersion: string;
  sdkVersion: string;
}

declare global {
  interface Window {
    __smartspectraBridge?: unknown;
    __vitalflowElectron?: {
      isElectron: boolean;
      getRuntimeInfo: () => Promise<ElectronRuntimeInfo>;
      authorizeCamera: (granted: boolean) => Promise<boolean>;
      setSessionApiKey: (key: string) => Promise<boolean>;
      clearSessionApiKey: () => Promise<boolean>;
      getSdkApiKey: () => Promise<string | null>;
    };
  }
}
