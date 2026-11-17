import { ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { DigitalGardenCanvas } from '../components/DigitalGardenCanvas';
import { SignalProcessor } from '../services/signalProcessor';
import type { AppScreen } from '../types/vitals';

interface WelcomeScreenProps {
  isElectron: boolean;
  onStartExperience: () => void;
  onNavigate: (screen: AppScreen) => void;
}

const idleProcessor = new SignalProcessor();

export function WelcomeScreen({
  isElectron,
  onStartExperience,
  onNavigate,
}: WelcomeScreenProps) {
  return (
    <div className="relative min-h-[calc(100vh-61px)] overflow-hidden">
      {/* Neutral ambient idle digital garden backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-65">
        <DigitalGardenCanvas
          theme="living-garden"
          rawMetrics={null}
          validationGuidance={null}
          processor={idleProcessor}
        />
      </div>

      {/* Measured contrast scrim so typography stays crisp */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050814]/55 via-[#050814]/70 to-[#050814]"
      />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-61px)] max-w-[1200px] flex-col justify-between px-6 py-16 md:py-24">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl pt-8 md:pt-14"
        >
          <p className="text-sm font-medium tracking-wide text-sky-300/90">
            VITALFLOW
            <span className="mx-2 text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-400">
              {isElectron
                ? 'Presage SmartSpectra Desktop Runtime'
                : 'Interactive Sensing Preview'}
            </span>
          </p>

          <h1
            className="mt-5 font-display text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl"
            style={{ textWrap: 'balance' }}
          >
            Your body. Your rhythm. Your world.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            An interactive environment powered by real-time human sensing.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={onStartExperience}
              className="inline-flex items-center gap-2.5 rounded-xl bg-sky-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-300 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              <span>Start Experience</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="text-sm font-medium text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white hover:decoration-sky-400 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
            >
              How It Works
            </button>
          </div>

          <div className="mt-8 flex items-start gap-2.5 text-xs leading-relaxed text-slate-400">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-sky-400/80"
              aria-hidden="true"
            />
            <p>
              Your camera only activates after you give explicit permission and
              start a session. No video is recorded or saved, and you can stop
              sensing at any moment.
            </p>
          </div>
        </motion.section>

        {/* Quiet 3-column architectural overview below the fold/bottom edge */}
        <section
          aria-label="How your presence shapes the environment"
          className="mt-16 grid gap-8 border-t border-slate-800/80 pt-10 md:grid-cols-3"
        >
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-100">
              01. Optical Presence
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Presage SmartSpectra reads subtle light and motion cues from your
              camera feed to measure breathing cadence, pulse rate, and HRV when
              available.
            </p>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-100">
              02. Living Canvas
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Your breathing expands and settles the garden while pulse rhythms
              choreograph light particles and ripples across three ambient worlds.
            </p>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-100">
              03. Honest Self-Awareness
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Designed strictly for wellness and reflection. Only genuine,
              validated readings are shown, with complete in-memory privacy.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
