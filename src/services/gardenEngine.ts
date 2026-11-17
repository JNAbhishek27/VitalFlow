import type { EnvironmentTheme, GardenVisualState } from '../types/vitals';

interface Particle {
  x: number;
  y: number;
  angle: number;
  orbitRadius: number;
  baseSize: number;
  speed: number;
  phaseOffset: number;
  hueMix: number;
  alpha: number;
}

interface RippleWave {
  radius: number;
  maxRadius: number;
  alpha: number;
  hue: 'cyan' | 'violet' | 'blue';
}

export class DigitalGardenEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private particles: Particle[] = [];
  private ripples: RippleWave[] = [];
  private lastRippleTrigger = 0;
  private elapsed = 0;
  private reducedMotion = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Could not initialize 2D Canvas context.');
    }
    this.ctx = context;
    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initParticles();
    this.resize();
  }

  private initParticles(): void {
    const count = 92;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
        orbitRadius: 0.14 + Math.random() * 0.42,
        baseSize: 1.1 + Math.random() * 2.4,
        speed: (0.04 + Math.random() * 0.08) * (i % 2 === 0 ? 1 : -1),
        phaseOffset: Math.random() * Math.PI * 2,
        hueMix: Math.random(),
        alpha: 0.25 + Math.random() * 0.55,
      });
    }
  }

  public resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  public render(
    dtSeconds: number,
    theme: EnvironmentTheme,
    visual: GardenVisualState,
  ): void {
    const dt = Math.min(0.05, Math.max(0.001, dtSeconds));
    const motionScale = this.reducedMotion ? 0.25 : 1.0;
    this.elapsed += dt * motionScale;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const minDim = Math.min(w, h);

    // Deep midnight base gradient
    const bgGrad = ctx.createRadialGradient(
      cx,
      cy,
      minDim * 0.04,
      cx,
      cy,
      Math.max(w, h) * 0.72,
    );
    bgGrad.addColorStop(0, visual.isQualityWarning ? '#0c1224' : '#0b1429');
    bgGrad.addColorStop(0.55, '#070b18');
    bgGrad.addColorStop(1, '#040711');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Spawn expanding pulse ripples on heartbeat crest when signal is active
    if (visual.isActiveSignal && visual.pulseRipple > 0.85 && this.elapsed - this.lastRippleTrigger > 0.35) {
      this.lastRippleTrigger = this.elapsed;
      this.ripples.push({
        radius: minDim * (0.08 + visual.breathExpansion * 0.06),
        maxRadius: minDim * 0.46,
        alpha: 0.36 * visual.stability,
        hue: theme === 'cosmic-waves' ? 'blue' : theme === 'breathing-mandala' ? 'violet' : 'cyan',
      });
    }

    // Update active ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += dt * minDim * 0.19 * motionScale;
      r.alpha -= dt * 0.24;
      if (r.alpha <= 0.01 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    if (theme === 'living-garden') {
      this.renderLivingGarden(ctx, cx, cy, minDim, visual, dt * motionScale);
    } else if (theme === 'cosmic-waves') {
      this.renderCosmicWaves(ctx, w, h, cx, cy, minDim, visual, dt * motionScale);
    } else {
      this.renderBreathingMandala(ctx, cx, cy, minDim, visual, dt * motionScale);
    }

    // Draw expanding circular waves across all themes
    for (const r of this.ripples) {
      ctx.beginPath();
      ctx.arc(cx, cy, r.radius, 0, Math.PI * 2);
      const color =
        visual.isQualityWarning
          ? `rgba(245, 158, 11, ${r.alpha * 0.65})`
          : r.hue === 'cyan'
            ? `rgba(34, 211, 238, ${r.alpha})`
            : r.hue === 'violet'
              ? `rgba(129, 140, 248, ${r.alpha})`
              : `rgba(56, 189, 248, ${r.alpha})`;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // Subtle calibration ring cue if signal quality is degraded
    if (visual.isQualityWarning) {
      const warnPulse = 0.2 + 0.14 * Math.sin(this.elapsed * 2.5);
      ctx.beginPath();
      ctx.arc(cx, cy, minDim * 0.34, 0, Math.PI * 2);
      ctx.setLineDash([6, 10]);
      ctx.strokeStyle = `rgba(245, 158, 11, ${warnPulse})`;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private renderLivingGarden(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    minDim: number,
    visual: GardenVisualState,
    dt: number,
  ): void {
    const breathScale = 0.72 + visual.breathExpansion * 0.42;
    const baseRadius = minDim * 0.19 * breathScale;
    const pulseGlow = 0.22 + visual.pulseRipple * 0.32;
    const stability = visual.stability;

    // Soft central bioluminescent aura
    const coreGlow = ctx.createRadialGradient(cx, cy, 4, cx, cy, baseRadius * 1.95);
    if (visual.isQualityWarning) {
      coreGlow.addColorStop(0, `rgba(245, 158, 11, ${0.22 * stability})`);
      coreGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
      coreGlow.addColorStop(1, 'rgba(5, 8, 20, 0)');
    } else {
      coreGlow.addColorStop(0, `rgba(34, 211, 238, ${0.24 + pulseGlow * 0.25})`);
      coreGlow.addColorStop(0.45, `rgba(56, 189, 248, ${0.12 * stability})`);
      coreGlow.addColorStop(0.8, `rgba(129, 140, 248, ${0.06 * stability})`);
      coreGlow.addColorStop(1, 'rgba(5, 8, 20, 0)');
    }
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * 1.95, 0, Math.PI * 2);
    ctx.fill();

    // Organic breathing rings
    const ringCount = visual.hrvModulated ? 5 : 3;
    for (let i = 0; i < ringCount; i++) {
      const frac = (i + 1) / ringCount;
      const ringR = baseRadius * (0.48 + frac * 0.65);
      const segments = 72;
      ctx.beginPath();
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        const harmonic =
          Math.sin(theta * (3 + i) + this.elapsed * (0.45 + i * 0.12)) *
          (4 + visual.complexity * 9) *
          stability;
        const r = ringR + harmonic;
        const px = cx + Math.cos(theta) * r;
        const py = cy + Math.sin(theta) * r;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle =
        i % 2 === 0
          ? `rgba(34, 211, 238, ${(0.18 + (1 - frac) * 0.24) * stability})`
          : `rgba(129, 140, 248, ${(0.14 + (1 - frac) * 0.2) * stability})`;
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }

    // Flowing organic botanical filaments
    const branchCount = Math.round(8 + visual.complexity * 12);
    for (let b = 0; b < branchCount; b++) {
      const baseAngle =
        (b / branchCount) * Math.PI * 2 + this.elapsed * 0.06;
      const sway = Math.sin(this.elapsed * 0.8 + b) * 0.14 * visual.stability;
      const tipRadius = baseRadius * (1.28 + 0.32 * visual.breathExpansion);

      const startX = cx + Math.cos(baseAngle) * (baseRadius * 0.28);
      const startY = cy + Math.sin(baseAngle) * (baseRadius * 0.28);
      const ctrlX =
        cx + Math.cos(baseAngle + sway) * (tipRadius * 0.62);
      const ctrlY =
        cy + Math.sin(baseAngle + sway) * (tipRadius * 0.62);
      const endX = cx + Math.cos(baseAngle - sway * 0.5) * tipRadius;
      const endY = cy + Math.sin(baseAngle - sway * 0.5) * tipRadius;

      const grad = ctx.createLinearGradient(startX, startY, endX, endY);
      grad.addColorStop(0, `rgba(56, 189, 248, ${0.32 * stability})`);
      grad.addColorStop(1, `rgba(34, 211, 238, ${0.04 * stability})`);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Luminous bloom node at filament tip
      const nodeSize = 2 + visual.pulseRipple * 2.2;
      ctx.beginPath();
      ctx.arc(endX, endY, nodeSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(34, 211, 238, ${(0.45 + visual.pulseRipple * 0.4) * stability})`;
      ctx.fill();
    }

    // Floating light points orbiting gently with pulse cadence
    const tempoFactor = visual.isActiveSignal ? visual.pulseCadenceBpm / 64 : 0.7;
    for (const p of this.particles) {
      p.angle += p.speed * dt * tempoFactor * (0.6 + 0.4 * stability);
      const radialDrift =
        p.orbitRadius * minDim * (0.78 + visual.breathExpansion * 0.26);
      const wobble = Math.sin(this.elapsed * 1.1 + p.phaseOffset) * 8;
      const px = cx + Math.cos(p.angle) * (radialDrift + wobble);
      const py = cy + Math.sin(p.angle) * (radialDrift + wobble);

      const pulseFlash =
        0.55 +
        0.45 * Math.sin(visual.pulsePhase + p.phaseOffset) * (visual.isActiveSignal ? 1 : 0.3);
      const size = p.baseSize * (0.85 + visual.pulseRipple * 0.45);
      const alpha = p.alpha * pulseFlash * (0.45 + 0.55 * stability);

      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      if (p.hueMix < 0.45) {
        ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
      } else if (p.hueMix < 0.8) {
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(129, 140, 248, ${alpha})`;
      }
      ctx.fill();
    }
  }

  private renderCosmicWaves(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cx: number,
    cy: number,
    minDim: number,
    visual: GardenVisualState,
    dt: number,
  ): void {
    const stability = visual.stability;
    const waveCount = Math.round(5 + visual.complexity * 5);
    const breathAmp = minDim * (0.045 + visual.breathExpansion * 0.085);

    // Subtle cosmic horizon glow
    const horizonGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, minDim * 0.55);
    horizonGlow.addColorStop(0, `rgba(56, 189, 248, ${0.18 + visual.pulseRipple * 0.18})`);
    horizonGlow.addColorStop(0.55, `rgba(129, 140, 248, ${0.08 * stability})`);
    horizonGlow.addColorStop(1, 'rgba(5, 8, 20, 0)');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, 0, w, h);

    // Flowing harmonic waves across viewport
    for (let i = 0; i < waveCount; i++) {
      const ratio = i / Math.max(1, waveCount - 1);
      const yBase = cy + (ratio - 0.5) * h * 0.36;
      const freq = 0.0055 + ratio * 0.004;
      const speed = (0.7 + ratio * 0.55) * (visual.pulseCadenceBpm / 64);

      ctx.beginPath();
      for (let x = 0; x <= w; x += 14) {
        const envelope = Math.sin((x / w) * Math.PI);
        const yOffset =
          Math.sin(x * freq + this.elapsed * speed + i * 0.85) *
            breathAmp *
            envelope +
          Math.cos(x * freq * 1.9 - this.elapsed * 0.6) *
            (breathAmp * 0.28 * visual.complexity) *
            envelope;
        const y = yBase + yOffset;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const alpha = (0.14 + (1 - Math.abs(ratio - 0.5) * 2) * 0.28) * stability;
      ctx.strokeStyle =
        i % 2 === 0
          ? `rgba(56, 189, 248, ${alpha})`
          : `rgba(129, 140, 248, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Central orbital breathing core
    const coreRadius = minDim * (0.09 + visual.breathExpansion * 0.06);
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(34, 211, 238, ${0.35 + visual.pulseRipple * 0.35})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Starfield / cosmic energy particles
    const tempo = visual.isActiveSignal ? visual.pulseCadenceBpm / 64 : 0.6;
    for (const p of this.particles) {
      p.x += p.speed * dt * 0.16 * tempo;
      if (p.x > 1.05) p.x = -0.05;
      if (p.x < -0.05) p.x = 1.05;

      const px = p.x * w;
      const py = p.y * h + Math.sin(this.elapsed + p.phaseOffset) * 14 * visual.breathExpansion;
      const alpha = p.alpha * (0.4 + 0.6 * stability);

      ctx.beginPath();
      ctx.arc(px, py, p.baseSize * (0.8 + visual.pulseRipple * 0.4), 0, Math.PI * 2);
      ctx.fillStyle =
        p.hueMix > 0.5
          ? `rgba(56, 189, 248, ${alpha})`
          : `rgba(129, 140, 248, ${alpha})`;
      ctx.fill();
    }
  }

  private renderBreathingMandala(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    minDim: number,
    visual: GardenVisualState,
    dt: number,
  ): void {
    const stability = visual.stability;
    const scale = 0.72 + visual.breathExpansion * 0.45;
    const outerRadius = minDim * 0.27 * scale;
    const symmetry = visual.hrvModulated
      ? Math.round(10 + visual.complexity * 8)
      : 12;

    // Ambient halo
    const halo = ctx.createRadialGradient(cx, cy, 4, cx, cy, outerRadius * 1.45);
    halo.addColorStop(0, `rgba(129, 140, 248, ${0.22 + visual.pulseRipple * 0.2})`);
    halo.addColorStop(0.55, `rgba(34, 211, 238, ${0.1 * stability})`);
    halo.addColorStop(1, 'rgba(5, 8, 20, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius * 1.45, 0, Math.PI * 2);
    ctx.fill();

    // Concentric geometric lotus layers
    const layers = 4;
    for (let l = 1; l <= layers; l++) {
      const layerRadius = outerRadius * (l / layers);
      const rotation =
        this.elapsed * (l % 2 === 0 ? 0.12 : -0.09) + (l * Math.PI) / symmetry;

      for (let i = 0; i < symmetry; i++) {
        const theta = rotation + (i / symmetry) * Math.PI * 2;
        const petalTipX = cx + Math.cos(theta) * layerRadius;
        const petalTipY = cy + Math.sin(theta) * layerRadius;

        const spread = (Math.PI / symmetry) * (0.85 + visual.breathExpansion * 0.35);
        const ctrlDist = layerRadius * 0.62;

        const c1x = cx + Math.cos(theta - spread) * ctrlDist;
        const c1y = cy + Math.sin(theta - spread) * ctrlDist;
        const c2x = cx + Math.cos(theta + spread) * ctrlDist;
        const c2y = cy + Math.sin(theta + spread) * ctrlDist;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(c1x, c1y, petalTipX, petalTipY);
        ctx.quadraticCurveTo(c2x, c2y, cx, cy);

        const alpha = (0.12 + (1 - l / (layers + 1)) * 0.22) * stability;
        ctx.strokeStyle =
          l % 2 === 0
            ? `rgba(34, 211, 238, ${alpha})`
            : `rgba(129, 140, 248, ${alpha})`;
        ctx.lineWidth = 1.15;
        ctx.stroke();
      }
    }

    // Center pulse jewel
    const centerRadius = minDim * (0.025 + visual.pulseRipple * 0.015);
    ctx.beginPath();
    ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(34, 211, 238, ${0.55 + visual.pulseRipple * 0.35})`;
    ctx.fill();

    // Orbiting harmonic dust points
    const tempo = visual.isActiveSignal ? visual.pulseCadenceBpm / 64 : 0.65;
    for (let i = 0; i < this.particles.length; i += 2) {
      const p = this.particles[i];
      p.angle += p.speed * dt * tempo;
      const r = outerRadius * (1.05 + p.orbitRadius * 0.7);
      const px = cx + Math.cos(p.angle) * r;
      const py = cy + Math.sin(p.angle) * r;
      ctx.beginPath();
      ctx.arc(px, py, p.baseSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(129, 140, 248, ${p.alpha * 0.65 * stability})`;
      ctx.fill();
    }
  }
}
