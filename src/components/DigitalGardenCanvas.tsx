import { useEffect, useRef } from 'react';
import { DigitalGardenEngine } from '../services/gardenEngine';
import { SignalProcessor } from '../services/signalProcessor';
import type {
  EnvironmentTheme,
  RawBiometricSnapshot,
  ValidationGuidance,
} from '../types/vitals';

interface DigitalGardenCanvasProps {
  theme: EnvironmentTheme;
  rawMetrics: RawBiometricSnapshot | null;
  validationGuidance: ValidationGuidance | null;
  processor: SignalProcessor;
  className?: string;
}

export function DigitalGardenCanvas({
  theme,
  rawMetrics,
  validationGuidance,
  processor,
  className = '',
}: DigitalGardenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef<EnvironmentTheme>(theme);
  const rawMetricsRef = useRef<RawBiometricSnapshot | null>(rawMetrics);
  const validationRef = useRef<ValidationGuidance | null>(validationGuidance);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    rawMetricsRef.current = rawMetrics;
  }, [rawMetrics]);

  useEffect(() => {
    validationRef.current = validationGuidance;
  }, [validationGuidance]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new DigitalGardenEngine(canvas);
    let rafId = 0;
    let lastTime = performance.now();

    const handleResize = () => {
      engine.resize();
    };

    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
    });
    resizeObserver.observe(canvas);
    window.addEventListener('resize', handleResize);

    const tick = (now: number) => {
      const dtSeconds = (now - lastTime) / 1000;
      lastTime = now;

      const visualState = processor.step(
        dtSeconds,
        rawMetricsRef.current,
        validationRef.current,
      );
      engine.render(dtSeconds, themeRef.current, visualState);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [processor]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Interactive biometric digital garden visualization"
      className={`block h-full w-full ${className}`}
    />
  );
}
