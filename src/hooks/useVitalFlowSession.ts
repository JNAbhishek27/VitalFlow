import { useCallback, useEffect, useRef, useState } from 'react';
import { SignalProcessor } from '../services/signalProcessor';
import {
  authorizeElectronCamera,
  getElectronRuntimeInfo,
  isElectronSmartSpectraAvailable,
  SmartSpectraController,
} from '../services/smartSpectraService';
import type {
  CameraStatus,
  DataSourceMode,
  ElectronRuntimeInfo,
  EnvironmentTheme,
  HrvSample,
  MetricSample,
  RawBiometricSnapshot,
  SdkErrorInfo,
  SdkLifecycleState,
  SessionSummaryData,
  ValidationGuidance,
} from '../types/vitals';

export function useVitalFlowSession() {
  const [electronInfo, setElectronInfo] = useState<ElectronRuntimeInfo | null>(null);
  const [isElectron] = useState<boolean>(() => isElectronSmartSpectraAvailable());
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>(() =>
    isElectronSmartSpectraAvailable() ? 'sdk' : 'demo',
  );
  const [telemetryEnabled, setTelemetryEnabled] = useState<boolean>(true);
  const [environmentTheme, setEnvironmentTheme] =
    useState<EnvironmentTheme>('living-garden');

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('inactive');
  const [cameraMessage, setCameraMessage] = useState<string>(
    'Camera inactive until you grant permission.',
  );
  const [sdkStatus, setSdkStatus] = useState<SdkLifecycleState>('uninitialized');
  const [validationGuidance, setValidationGuidance] =
    useState<ValidationGuidance | null>(null);
  const [rawMetrics, setRawMetrics] = useState<RawBiometricSnapshot | null>(null);
  const [errorInfo, setErrorInfo] = useState<SdkErrorInfo | null>(null);

  const [isRecordingSession, setIsRecordingSession] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [sessionSummary, setSessionSummary] =
    useState<SessionSummaryData | null>(null);

  const controllerRef = useRef<SmartSpectraController | null>(null);
  const processorRef = useRef<SignalProcessor>(new SignalProcessor());

  // In-memory session buffers (cleared on stop/clear)
  const sessionStartMsRef = useRef<number>(0);
  const pulseSamplesRef = useRef<MetricSample[]>([]);
  const breathingSamplesRef = useRef<MetricSample[]>([]);
  const hrvSamplesRef = useRef<HrvSample[]>([]);
  const validationTotalRef = useRef<number>(0);
  const validationOptimalRef = useRef<number>(0);
  const validationNotesSetRef = useRef<Set<string>>(new Set());
  const isRecordingRef = useRef<boolean>(false);

  useEffect(() => {
    isRecordingRef.current = isRecordingSession;
  }, [isRecordingSession]);

  const refreshElectronInfo = useCallback(async () => {
    const info = await getElectronRuntimeInfo();
    setElectronInfo(info);
    return info;
  }, []);

  useEffect(() => {
    void refreshElectronInfo();
  }, [refreshElectronInfo]);

  // Instantiate dedicated SmartSpectraController once
  useEffect(() => {
    const controller = new SmartSpectraController({
      onStreamAvailable: (stream) => {
        setCameraStream(stream);
      },
      onCameraStatus: (status, message) => {
        setCameraStatus(status);
        if (message) setCameraMessage(message);
      },
      onProcessingStatus: (status) => {
        setSdkStatus(status);
      },
      onValidationStatus: (guidance) => {
        setValidationGuidance(guidance);
        if (isRecordingRef.current) {
          validationTotalRef.current += 1;
          if (guidance.severity === 'optimal') {
            validationOptimalRef.current += 1;
          } else if (guidance.title) {
            validationNotesSetRef.current.add(guidance.title);
          }
        }
      },
      onMetrics: (snapshot) => {
        setRawMetrics(snapshot);
        if (isRecordingRef.current) {
          const now = Date.now();
          if (snapshot.pulseBpm !== null && snapshot.pulseStable) {
            pulseSamplesRef.current.push({
              timestampMs: now,
              value: snapshot.pulseBpm,
              confidence: snapshot.pulseConfidence ?? 0,
              stable: snapshot.pulseStable,
            });
          }
          if (snapshot.breathingRate !== null && snapshot.breathingStable) {
            breathingSamplesRef.current.push({
              timestampMs: now,
              value: snapshot.breathingRate,
              confidence: snapshot.breathingConfidence ?? 0,
              stable: snapshot.breathingStable,
            });
          }
          if (
            snapshot.hrvRmssd !== null &&
            snapshot.hrvStable &&
            snapshot.hrvSdnn !== null
          ) {
            hrvSamplesRef.current.push({
              timestampMs: now,
              rmssd: snapshot.hrvRmssd,
              sdnn: snapshot.hrvSdnn,
              confidence: snapshot.hrvConfidence ?? 0,
              stable: snapshot.hrvStable,
            });
          }
        }
      },
      onError: (err) => {
        setErrorInfo(err);
      },
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  // Session duration timer
  useEffect(() => {
    if (!isRecordingSession) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - sessionStartMsRef.current) / 1000)),
      );
    }, 500);
    return () => clearInterval(interval);
  }, [isRecordingSession]);

  const resetSampleBuffers = useCallback(() => {
    sessionStartMsRef.current = Date.now();
    pulseSamplesRef.current = [];
    breathingSamplesRef.current = [];
    hrvSamplesRef.current = [];
    validationTotalRef.current = 0;
    validationOptimalRef.current = 0;
    validationNotesSetRef.current = new Set();
    setElapsedSeconds(0);
    processorRef.current.reset();
  }, []);

  const initializeSetup = useCallback(
    async (mode: DataSourceMode, options?: { withCameraPreview?: boolean }) => {
      setErrorInfo(null);
      setDataSourceMode(mode);
      setRawMetrics(null);
      setValidationGuidance(null);
      processorRef.current.reset();

      if (!controllerRef.current) return;

      if (mode === 'sdk') {
        await controllerRef.current.startSdkSession({
          enableTelemetry: telemetryEnabled,
        });
      } else {
        await controllerRef.current.startDemoSession({
          withCameraPreview: options?.withCameraPreview ?? true,
        });
      }
    },
    [telemetryEnabled],
  );

  const beginMeasurement = useCallback(() => {
    resetSampleBuffers();
    setSessionSummary(null);
    setIsRecordingSession(true);
  }, [resetSampleBuffers]);

  const stopSessionAndSummarize = useCallback(async () => {
    const endedAtMs = Date.now();
    const durationSeconds = Math.max(
      1,
      Math.round((endedAtMs - sessionStartMsRef.current) / 1000),
    );

    const summary: SessionSummaryData = {
      startedAtMs: sessionStartMsRef.current,
      endedAtMs,
      durationSeconds,
      source: dataSourceMode,
      pulseSamples: [...pulseSamplesRef.current],
      breathingSamples: [...breathingSamplesRef.current],
      hrvSamples: [...hrvSamplesRef.current],
      totalValidationPackets: validationTotalRef.current,
      optimalValidationPackets: validationOptimalRef.current,
      validationNotes: Array.from(validationNotesSetRef.current),
    };

    setIsRecordingSession(false);
    isRecordingRef.current = false;

    if (controllerRef.current) {
      await controllerRef.current.stop();
    }
    await authorizeElectronCamera(false);
    setSessionSummary(summary);
    return summary;
  }, [dataSourceMode]);

  const cancelSetup = useCallback(async () => {
    setIsRecordingSession(false);
    isRecordingRef.current = false;
    if (controllerRef.current) {
      await controllerRef.current.stop();
    }
    await authorizeElectronCamera(false);
    setRawMetrics(null);
    setValidationGuidance(null);
    setErrorInfo(null);
  }, []);

  const restartMeasurement = useCallback(async () => {
    setErrorInfo(null);
    resetSampleBuffers();
    setIsRecordingSession(true);
    if (controllerRef.current && !controllerRef.current.isRunning()) {
      if (dataSourceMode === 'sdk') {
        await controllerRef.current.startSdkSession({
          enableTelemetry: telemetryEnabled,
        });
      } else {
        await controllerRef.current.startDemoSession({
          withCameraPreview: true,
        });
      }
    }
  }, [dataSourceMode, resetSampleBuffers, telemetryEnabled]);

  const clearSessionData = useCallback(() => {
    pulseSamplesRef.current = [];
    breathingSamplesRef.current = [];
    hrvSamplesRef.current = [];
    validationTotalRef.current = 0;
    validationOptimalRef.current = 0;
    validationNotesSetRef.current = new Set();
    setSessionSummary(null);
    setRawMetrics(null);
    setValidationGuidance(null);
    setErrorInfo(null);
    setElapsedSeconds(0);
    processorRef.current.reset();
  }, []);

  return {
    isElectron,
    electronInfo,
    refreshElectronInfo,
    dataSourceMode,
    setDataSourceMode,
    telemetryEnabled,
    setTelemetryEnabled,
    environmentTheme,
    setEnvironmentTheme,
    cameraStream,
    cameraStatus,
    cameraMessage,
    sdkStatus,
    validationGuidance,
    rawMetrics,
    errorInfo,
    setErrorInfo,
    isRecordingSession,
    elapsedSeconds,
    sessionSummary,
    processorRef,
    initializeSetup,
    beginMeasurement,
    stopSessionAndSummarize,
    cancelSetup,
    restartMeasurement,
    clearSessionData,
  };
}
