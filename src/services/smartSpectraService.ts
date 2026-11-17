import {
  breathingMetrics,
  cardioMetrics,
  ProcessingStatus,
  SmartSpectraSDK,
  ValidationCode,
} from '@smartspectra/node-sdk/renderer';
import { decodeMetrics } from '@smartspectra/node-sdk/messages';
import type {
  CameraStatus,
  DataSourceMode,
  ElectronRuntimeInfo,
  RawBiometricSnapshot,
  SdkErrorInfo,
  SdkLifecycleState,
  ValidationGuidance,
} from '../types/vitals';
import {
  mapProcessingStatus,
  mapSdkError,
  mapValidationStatus,
} from '../utils/validationGuidance';

export interface SmartSpectraServiceCallbacks {
  onStreamAvailable: (stream: MediaStream | null) => void;
  onCameraStatus: (status: CameraStatus, message?: string) => void;
  onProcessingStatus: (status: SdkLifecycleState) => void;
  onValidationStatus: (guidance: ValidationGuidance) => void;
  onMetrics: (snapshot: RawBiometricSnapshot) => void;
  onError: (error: SdkErrorInfo) => void;
}

export function isElectronSmartSpectraAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.__smartspectraBridge) &&
    Boolean(window.__vitalflowElectron?.isElectron)
  );
}

export async function getElectronRuntimeInfo(): Promise<ElectronRuntimeInfo | null> {
  if (!window.__vitalflowElectron) return null;
  try {
    return await window.__vitalflowElectron.getRuntimeInfo();
  } catch {
    return null;
  }
}

export async function authorizeElectronCamera(granted: boolean): Promise<boolean> {
  if (!window.__vitalflowElectron) return granted;
  try {
    return await window.__vitalflowElectron.authorizeCamera(granted);
  } catch {
    return false;
  }
}

export async function setElectronSessionApiKey(key: string): Promise<boolean> {
  if (!window.__vitalflowElectron) return false;
  return await window.__vitalflowElectron.setSessionApiKey(key);
}

export async function clearElectronSessionApiKey(): Promise<void> {
  if (!window.__vitalflowElectron) return;
  await window.__vitalflowElectron.clearSessionApiKey();
}

const MAX_TRACE_POINTS = 96;

function appendTrace(existing: number[], incoming: number[]): number[] {
  if (incoming.length === 0) return existing;
  const merged = existing.concat(incoming);
  if (merged.length <= MAX_TRACE_POINTS) return merged;
  return merged.slice(merged.length - MAX_TRACE_POINTS);
}

export class SmartSpectraController {
  private sdk: SmartSpectraSDK | null = null;
  private previewStream: MediaStream | null = null;
  private demoTimer: number | null = null;
  private demoStartTime = 0;
  private mode: DataSourceMode = 'sdk';
  private callbacks: SmartSpectraServiceCallbacks;
  private latestSnapshot: RawBiometricSnapshot = createEmptySnapshot('sdk');
  private active = false;

  constructor(callbacks: SmartSpectraServiceCallbacks) {
    this.callbacks = callbacks;
  }

  public getMode(): DataSourceMode {
    return this.mode;
  }

  public isRunning(): boolean {
    return this.active;
  }

  public async startSdkSession(options: {
    enableTelemetry: boolean;
  }): Promise<void> {
    await this.stop();
    this.mode = 'sdk';
    this.latestSnapshot = createEmptySnapshot('sdk');

    if (!isElectronSmartSpectraAvailable()) {
      this.callbacks.onProcessingStatus('error');
      this.callbacks.onError({
        code: 3,
        message: 'Electron SmartSpectra IPC bridge is unavailable in standard web browsers.',
        retryable: false,
        recoveryHint:
          'Run VITALFLOW in the Electron desktop runtime for genuine SmartSpectra SDK processing, or select Demo Mode to preview the responsive digital garden in browser.',
      });
      return;
    }

    await authorizeElectronCamera(true);
    const apiKey = (await window.__vitalflowElectron?.getSdkApiKey()) ?? '';

    if (!apiKey) {
      this.callbacks.onProcessingStatus('error');
      this.callbacks.onError({
        code: 2,
        message: 'No Presage SmartSpectra API key is configured.',
        retryable: true,
        recoveryHint:
          'Set SMARTSPECTRA_API_KEY in your .env file or provide a session key in Setup before starting.',
      });
      return;
    }

    this.callbacks.onCameraStatus('requesting', 'Requesting camera permission...');
    this.callbacks.onProcessingStatus('starting');

    const sdk = new SmartSpectraSDK({
      apiKey,
      requestedMetrics: [...breathingMetrics, ...cardioMetrics],
      enableAccumulatedOutput: true,
      enableTelemetry: options.enableTelemetry,
    });

    this.sdk = sdk;

    sdk.on('streamAvailable', (stream) => {
      this.previewStream = stream;
      this.callbacks.onStreamAvailable(stream);
      this.callbacks.onCameraStatus('ready', 'Live camera stream active');
    });

    sdk.on('processingStatus', (statusCode) => {
      const mapped = mapProcessingStatus(statusCode);
      this.callbacks.onProcessingStatus(mapped);
      if (statusCode === ProcessingStatus.kRunning) {
        this.callbacks.onCameraStatus('ready', 'Camera active and sensing');
      }
    });

    sdk.on('validationStatus', (code, timestampUs, hint) => {
      const guidance = mapValidationStatus(code, timestampUs, hint);
      this.callbacks.onValidationStatus(guidance);
    });

    sdk.on('metrics', (buf, timestampUs) => {
      this.handleDecodedMetrics(buf, timestampUs);
    });

    sdk.on('accumulatedMetrics', (buf, timestampUs) => {
      this.handleDecodedMetrics(buf, timestampUs);
    });

    sdk.on('error', (code, message, retryable) => {
      this.callbacks.onError(mapSdkError(code, message, retryable));
    });

    try {
      this.active = true;
      await sdk.start();
    } catch (err) {
      this.active = false;
      const errObj = err as Error & { code?: number; retryable?: boolean; cause?: { name?: string } };
      const causeName = errObj?.cause?.name || errObj?.name || '';

      if (causeName === 'NotAllowedError' || errObj?.message?.includes('NotAllowedError')) {
        this.callbacks.onCameraStatus('denied', 'Camera permission was denied.');
        this.callbacks.onProcessingStatus('error');
        this.callbacks.onError({
          code: 7,
          message: 'Camera permission was denied.',
          retryable: true,
          recoveryHint:
            'Allow camera access in your system or browser settings, then retry initialization.',
        });
      } else if (
        causeName === 'NotFoundError' ||
        causeName === 'NotReadableError' ||
        errObj?.message?.includes('NotFoundError')
      ) {
        this.callbacks.onCameraStatus('unavailable', 'No accessible camera was found.');
        this.callbacks.onProcessingStatus('error');
        this.callbacks.onError({
          code: 7,
          message: errObj.message || 'Camera unavailable.',
          retryable: true,
          recoveryHint:
            'Connect a webcam or close other video apps using the camera, then retry.',
        });
      } else {
        this.callbacks.onProcessingStatus('error');
        this.callbacks.onError(
          mapSdkError(
            typeof errObj?.code === 'number' ? errObj.code : 8,
            errObj?.message || 'Failed to start SmartSpectra SDK.',
            errObj?.retryable ?? true,
          ),
        );
      }
      await this.stop();
    }
  }

  private handleDecodedMetrics(buf: Uint8Array, timestampUs: number): void {
    try {
      const decoded = decodeMetrics(buf);
      const next: RawBiometricSnapshot = {
        ...this.latestSnapshot,
        source: 'sdk',
        lastPacketTimestampUs: timestampUs,
      };

      const pulseList = decoded.cardio?.pulseRate;
      if (Array.isArray(pulseList) && pulseList.length > 0) {
        const latest = pulseList[pulseList.length - 1];
        if (typeof latest?.value === 'number' && Number.isFinite(latest.value) && latest.value > 0) {
          next.pulseBpm = latest.value;
          next.pulseConfidence =
            typeof latest.confidence === 'number' ? latest.confidence : null;
          next.pulseStable = Boolean(latest.stable);
        }
      }

      const arterialList = decoded.cardio?.arterialPressureTrace;
      if (Array.isArray(arterialList) && arterialList.length > 0) {
        const values = arterialList
          .map((item) => item?.value)
          .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        next.arterialTrace = appendTrace(next.arterialTrace, values);
      }

      const hrvList = decoded.cardio?.hrv;
      if (Array.isArray(hrvList) && hrvList.length > 0) {
        const latestHrv = hrvList[hrvList.length - 1];
        if (
          typeof latestHrv?.rmssd === 'number' &&
          Number.isFinite(latestHrv.rmssd) &&
          latestHrv.rmssd > 0
        ) {
          next.hrvRmssd = latestHrv.rmssd;
          next.hrvSdnn =
            typeof latestHrv.sdnn === 'number' && Number.isFinite(latestHrv.sdnn)
              ? latestHrv.sdnn
              : null;
          next.hrvConfidence =
            typeof latestHrv.confidence === 'number' ? latestHrv.confidence : null;
          next.hrvStable = Boolean(latestHrv.stable);
        }
      }

      const breathingList = decoded.breathing?.rate;
      if (Array.isArray(breathingList) && breathingList.length > 0) {
        const latestBreath = breathingList[breathingList.length - 1];
        if (
          typeof latestBreath?.value === 'number' &&
          Number.isFinite(latestBreath.value) &&
          latestBreath.value > 0
        ) {
          next.breathingRate = latestBreath.value;
          next.breathingConfidence =
            typeof latestBreath.confidence === 'number' ? latestBreath.confidence : null;
          next.breathingStable = Boolean(latestBreath.stable);
        }
      }

      const upperTrace = decoded.breathing?.upperTrace;
      if (Array.isArray(upperTrace) && upperTrace.length > 0) {
        const values = upperTrace
          .map((item) => item?.value)
          .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        next.upperBreathingTrace = appendTrace(next.upperBreathingTrace, values);
      }

      const lowerTrace = decoded.breathing?.lowerTrace;
      if (Array.isArray(lowerTrace) && lowerTrace.length > 0) {
        const values = lowerTrace
          .map((item) => item?.value)
          .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        next.lowerBreathingTrace = appendTrace(next.lowerBreathingTrace, values);
      }

      this.latestSnapshot = next;
      this.callbacks.onMetrics(next);
    } catch (err) {
      console.warn('[SmartSpectraService] Failed to decode metrics buffer:', err);
    }
  }

  /**
   * Explicitly labeled DEMO DATA mode for UI development and browser preview
   * environments where the Electron native SmartSpectra runtime is unavailable.
   * Optionally attaches real local camera preview if the user grants permission.
   */
  public async startDemoSession(options: { withCameraPreview: boolean }): Promise<void> {
    await this.stop();
    this.mode = 'demo';
    this.latestSnapshot = createEmptySnapshot('demo');
    this.active = true;
    this.demoStartTime = performance.now();

    this.callbacks.onProcessingStatus('starting');

    if (options.withCameraPreview && navigator.mediaDevices?.getUserMedia) {
      this.callbacks.onCameraStatus('requesting', 'Requesting browser camera preview...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        });
        if (!this.active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        this.previewStream = stream;
        this.callbacks.onStreamAvailable(stream);
        this.callbacks.onCameraStatus('ready', 'Camera preview active (Demo signal pipeline)');
      } catch (err) {
        const error = err as DOMException;
        if (error?.name === 'NotAllowedError') {
          this.callbacks.onCameraStatus('denied', 'Browser camera access declined; running Demo stream without video.');
        } else {
          this.callbacks.onCameraStatus('unavailable', 'No browser camera detected; running Demo stream without video.');
        }
        this.callbacks.onStreamAvailable(null);
      }
    } else {
      this.callbacks.onCameraStatus('inactive', 'Demo mode active (simulated signal pipeline)');
      this.callbacks.onStreamAvailable(null);
    }

    this.callbacks.onProcessingStatus('running');
    this.callbacks.onValidationStatus(
      mapValidationStatus(
        ValidationCode.kOk,
        Date.now() * 1000,
        'DEMO DATA: Simulated optimal optical framing.',
      ),
    );

    this.demoTimer = window.setInterval(() => {
      if (!this.active) return;
      const elapsedSec = (performance.now() - this.demoStartTime) / 1000;

      // Realistic warmup period (first 2.5s shows calibrating state)
      if (elapsedSec < 2.5) {
        return;
      }

      const breathRate = 13.4 + Math.sin(elapsedSec * 0.14) * 1.4;
      const pulseRate = 66 + Math.sin(elapsedSec * 0.22) * 3.8 + Math.cos(elapsedSec * 0.08) * 1.5;
      const breathWave = Math.sin((elapsedSec * breathRate * Math.PI * 2) / 60);
      const pulseWave =
        Math.pow(Math.max(0, Math.sin((elapsedSec * pulseRate * Math.PI * 2) / 60)), 3) * 0.8 +
        0.2 * Math.sin((elapsedSec * pulseRate * Math.PI * 4) / 60);

      // Demo HRV surfaces only after 10 seconds to mirror realistic windowing
      const hasDemoHrv = elapsedSec >= 10;

      const next: RawBiometricSnapshot = {
        source: 'demo',
        pulseBpm: Number(pulseRate.toFixed(1)),
        pulseConfidence: 88,
        pulseStable: true,
        breathingRate: Number(breathRate.toFixed(1)),
        breathingConfidence: 84,
        breathingStable: true,
        hrvRmssd: hasDemoHrv ? Number((46 + Math.sin(elapsedSec * 0.1) * 7).toFixed(1)) : null,
        hrvSdnn: hasDemoHrv ? Number((54 + Math.cos(elapsedSec * 0.09) * 6).toFixed(1)) : null,
        hrvConfidence: hasDemoHrv ? 76 : null,
        hrvStable: hasDemoHrv,
        upperBreathingTrace: appendTrace(this.latestSnapshot.upperBreathingTrace, [breathWave]),
        lowerBreathingTrace: appendTrace(this.latestSnapshot.lowerBreathingTrace, [breathWave * 0.72]),
        arterialTrace: appendTrace(this.latestSnapshot.arterialTrace, [pulseWave]),
        lastPacketTimestampUs: Date.now() * 1000,
      };

      this.latestSnapshot = next;
      this.callbacks.onMetrics(next);
    }, 250);
  }

  public async stop(): Promise<void> {
    this.active = false;

    if (this.demoTimer !== null) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }

    if (this.sdk) {
      const activeSdk = this.sdk;
      this.sdk = null;
      try {
        await activeSdk.stop();
      } catch {
        // Ignore stop errors during teardown
      }
      try {
        activeSdk.destroy();
      } catch {
        // Ignore destroy errors during teardown
      }
    }

    if (this.previewStream) {
      for (const track of this.previewStream.getTracks()) {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      }
      this.previewStream = null;
    }

    this.callbacks.onStreamAvailable(null);
    this.callbacks.onCameraStatus('inactive', 'Camera released');
    this.callbacks.onProcessingStatus('idle');
  }

  public destroy(): void {
    void this.stop();
  }
}

export function createEmptySnapshot(source: DataSourceMode): RawBiometricSnapshot {
  return {
    source,
    pulseBpm: null,
    pulseConfidence: null,
    pulseStable: false,
    breathingRate: null,
    breathingConfidence: null,
    breathingStable: false,
    hrvRmssd: null,
    hrvSdnn: null,
    hrvConfidence: null,
    hrvStable: false,
    upperBreathingTrace: [],
    lowerBreathingTrace: [],
    arterialTrace: [],
    lastPacketTimestampUs: null,
  };
}
