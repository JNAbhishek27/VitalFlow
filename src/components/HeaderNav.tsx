import type { AppScreen } from '../types/vitals';

interface HeaderNavProps {
  activeScreen: AppScreen;
  isSessionActive: boolean;
  onNavigate: (screen: AppScreen) => void;
  onPrimaryAction: () => void;
}

export function HeaderNav({
  activeScreen,
  isSessionActive,
  onNavigate,
  onPrimaryAction,
}: HeaderNavProps) {
  const navItems: { id: AppScreen; label: string }[] = [
    { id: 'welcome', label: 'Experience' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'privacy', label: 'Privacy' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-[#050814]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('welcome')}
          className="font-display text-lg font-semibold tracking-tight text-slate-50 transition-opacity hover:opacity-85 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
        >
          VITALFLOW
        </button>

        {/* Zone 2: Clean single-line text links */}
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-4 text-xs font-medium text-slate-400 sm:gap-7 sm:text-sm"
        >
          {navItems.map((item) => {
            const isActive =
              activeScreen === item.id ||
              (item.id === 'welcome' &&
                (activeScreen === 'consent' ||
                  activeScreen === 'measurement' ||
                  activeScreen === 'summary'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400 ${
                  isActive
                    ? 'text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-1 h-px bg-sky-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="rounded-lg bg-sky-500/90 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            {isSessionActive ? 'End Session' : 'Start Experience'}
          </button>
        </div>
      </div>
    </header>
  );
}
