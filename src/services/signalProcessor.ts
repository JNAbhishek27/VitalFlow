import type {
  GardenVisualState,
  RawBiometricSnapshot,
  ValidationGuidance,
} from '../types/vitals';

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * SignalProcessor strictly separates raw SmartSpectra biometric telemetry from
 * the smoothed continuous animation state rendered by the Canvas engine.
 * It never invents or infers missing biometrics (e.g. HRV is never inferred from pulse).
 */
export class SignalProcessor {
  private state: GardenVisualState = {
    breathPhase: 0,
    breathExpansion: 0.35,
    pulsePhase: 0,
    pulseRipple: 0,
    pulseCadenceBpm: 64,
    breathingCadenceRpm: 14,
    complexity: 0.35,
    stability: 0.85,
    isActiveSignal: false,
    isQualityWarning: false,
    hrvModulated: false,
  };

  private lastPulseCrestPhase = 0;

  public reset(): void {
    this.state = {
      breathPhase: 0,
      breathExpansion: 0.35,
      pulsePhase: 0,
      pulseRipple: 0,
      pulseCadenceBpm: 64,
      breathingCadenceRpm: 14,
      complexity: 0.35,
      stability: 0.85,
      isActiveSignal: false,
      isQualityWarning: false,
      hrvModulated: false,
    };
    this.lastPulseCrestPhase = 0;
  }

  public step(
    dtSeconds: number,
    raw: RawBiometricSnapshot | null,
    validation: ValidationGuidance | null,
  ): GardenVisualState {
    const dt = clamp(dtSeconds, 0.001, 0.1);
    const smoothingSlow = 1 - Math.exp(-dt * 2.2);
    const smoothingMed = 1 - Math.exp(-dt * 4.5);

    const hasValidPulse = Boolean(
      raw && raw.pulseBpm !== null && Number.isFinite(raw.pulseBpm) && raw.pulseBpm > 25,
    );
    const hasValidBreathing = Boolean(
      raw &&
        raw.breathingRate !== null &&
        Number.isFinite(raw.breathingRate) &&
        raw.breathingRate > 2,
    );
    const hasValidHrv = Boolean(
      raw &&
        raw.hrvRmssd !== null &&
        Number.isFinite(raw.hrvRmssd) &&
        raw.hrvRmssd > 0 &&
        raw.hrvStable,
    );

    const isActiveSignal = hasValidPulse || hasValidBreathing;
    this.state.isActiveSignal = isActiveSignal;

    // Quality stability from validation status & signal confidence
    let targetStability = 0.82;
    let isQualityWarning = false;

    if (validation) {
      if (validation.severity === 'optimal') {
        targetStability = 1.0;
      } else if (validation.severity === 'adjust') {
        targetStability = 0.56;
        isQualityWarning = true;
      } else if (validation.severity === 'blocked') {
        targetStability = 0.25;
        isQualityWarning = true;
      }
    }

    if (raw && isActiveSignal) {
      const confSamples = [raw.pulseConfidence, raw.breathingConfidence].filter(
        (c): c is number => c !== null && Number.isFinite(c),
      );
      if (confSamples.length > 0) {
        const avgConf = confSamples.reduce((a, b) => a + b, 0) / confSamples.length;
        const confFactor = clamp(avgConf / 100, 0.25, 1.0);
        targetStability = targetStability * (0.55 + 0.45 * confFactor);
      }
    }

    this.state.stability = lerp(this.state.stability, targetStability, smoothingMed);
    this.state.isQualityWarning = isQualityWarning;

    // Smooth breathing cadence & expansion
    const targetBreathingRpm =
      hasValidBreathing && raw && raw.breathingRate !== null
        ? clamp(raw.breathingRate, 4, 40)
        : 12; // Gentle neutral idle breathing cadence when no signal is present

    this.state.breathingCadenceRpm = lerp(
      this.state.breathingCadenceRpm,
      targetBreathingRpm,
      smoothingSlow,
    );

    const breathFreqHz = this.state.breathingCadenceRpm / 60;
    this.state.breathPhase += dt * breathFreqHz * Math.PI * 2;

    // If live chest/abdomen breathing trace has recent samples, blend its normalized wave gently
    let targetBreathExpansion = 0.5 + 0.5 * Math.sin(this.state.breathPhase);
    if (
      hasValidBreathing &&
      raw?.upperBreathingTrace &&
      raw.upperBreathingTrace.length >= 6
    ) {
      const recent = raw.upperBreathingTrace.slice(-24);
      const min = Math.min(...recent);
      const max = Math.max(...recent);
      const span = max - min;
      if (span > 1e-4) {
        const latestNorm = clamp((recent[recent.length - 1] - min) / span, 0, 1);
        targetBreathExpansion = lerp(targetBreathExpansion, latestNorm, 0.45);
      }
    }

    this.state.breathExpansion = lerp(
      this.state.breathExpansion,
      targetBreathExpansion,
      smoothingMed,
    );

    // Smooth pulse cadence & ripple crest
    const targetPulseBpm =
      hasValidPulse && raw && raw.pulseBpm !== null
        ? clamp(raw.pulseBpm, 36, 180)
        : 60; // Neutral idle tempo when no pulse sample exists

    this.state.pulseCadenceBpm = lerp(
      this.state.pulseCadenceBpm,
      targetPulseBpm,
      smoothingSlow,
    );

    const pulseFreqHz = this.state.pulseCadenceBpm / 60;
    this.state.pulsePhase += dt * pulseFreqHz * Math.PI * 2;

    // Trigger ripple softly at each beat cycle (2*PI) when active pulse signal exists
    const currentCycle = Math.floor(this.state.pulsePhase / (Math.PI * 2));
    if (currentCycle > this.lastPulseCrestPhase) {
      this.lastPulseCrestPhase = currentCycle;
      if (hasValidPulse) {
        this.state.pulseRipple = 1.0;
      }
    } else {
      this.state.pulseRipple = Math.max(0, this.state.pulseRipple - dt * 1.45);
    }

    // Complexity is ONLY modulated by genuine HRV when available
    this.state.hrvModulated = hasValidHrv;
    const targetComplexity =
      hasValidHrv && raw && raw.hrvRmssd !== null
        ? clamp(0.25 + (raw.hrvRmssd / 110) * 0.75, 0.25, 1.0)
        : 0.35;

    this.state.complexity = lerp(this.state.complexity, targetComplexity, smoothingSlow);

    return { ...this.state };
  }
}
