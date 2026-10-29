import React from 'react';
import { BIRD_CATALOG, LEVELS } from '../game/levels';
import { BirdType } from '../game/types';

interface HudOverlayProps {
  levelId: number;
  score: number;
  bestScore: number;
  activeBirdType: BirdType | null;
  birdQueue: BirdType[];
  enemiesRemaining: number;
  totalEnemies: number;
  isOverview: boolean;
  isMuted: boolean;
  onToggleOverview: () => void;
  onToggleMute: () => void;
  onRestart: () => void;
  onPause: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  levelId,
  score,
  bestScore,
  activeBirdType,
  birdQueue,
  enemiesRemaining,
  totalEnemies,
  isOverview,
  isMuted,
  onToggleOverview,
  onToggleMute,
  onRestart,
  onPause,
}) => {
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
  const currentBirdMeta = activeBirdType ? BIRD_CATALOG[activeBirdType] : null;

  return (
    <div
      className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-5"
      aria-label="Gameplay HUD"
    >
      {/* Top Perimeter Row: Left Telemetry Cluster + Right Utility Controls */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Cluster: World-Matched Timber & Brass Plaque */}
        <div
          className="pointer-events-auto flex items-center gap-5 px-4 py-2.5 rounded-xl border-2 border-[#92400e] shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
          style={{ backgroundColor: 'rgba(35, 22, 15, 0.92)' }}
        >
          {/* Stage & Score Readout (Hero-to-Kicker 3:1 Scale) */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              STAGE {level.id} · SCORE
            </div>
            <div
              className="text-2xl md:text-3xl font-display font-extrabold text-amber-100 font-mono-tabular leading-none mt-0.5 hud-stroke"
              data-testid="hud-score"
            >
              {Math.round(score)}
            </div>
          </div>

          <div className="h-8 w-[1px] bg-amber-800/60" />

          {/* Best Score Readout */}
          <div className="hidden sm:block">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
              BEST
            </div>
            <div className="text-xl font-display font-bold text-amber-200/90 font-mono-tabular leading-none mt-0.5">
              {Math.round(Math.max(score, bestScore))}
            </div>
          </div>

          <div className="hidden sm:block h-8 w-[1px] bg-amber-800/60" />

          {/* Boar Targets Remaining Socket Pips */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              BOARS ({enemiesRemaining}/{totalEnemies})
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {Array.from({ length: totalEnemies }).map((_, idx) => {
                const alive = idx < enemiesRemaining;
                return (
                  <svg
                    key={idx}
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill={alive ? '#22c55e' : '#1c1917'}
                      stroke="#1b1410"
                      strokeWidth="2.5"
                    />
                    {alive ? (
                      <>
                        <ellipse cx="12" cy="13.5" rx="4.5" ry="3" fill="#86efac" />
                        <circle cx="10.5" cy="13.5" r="1" fill="#14532d" />
                        <circle cx="13.5" cy="13.5" r="1" fill="#14532d" />
                      </>
                    ) : (
                      <path
                        d="M8 8 L16 16 M16 8 L8 16"
                        stroke="#78716c"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                );
              })}
            </div>
          </div>

          <div className="h-8 w-[1px] bg-amber-800/60" />

          {/* Active Bird & Queue Clue */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {activeBirdType && (
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-amber-200 shadow-sm"
                  style={{ backgroundColor: BIRD_CATALOG[activeBirdType].color }}
                  title={BIRD_CATALOG[activeBirdType].name}
                >
                  <span className="w-2 h-2 rounded-full bg-white/90" />
                </span>
              )}
              {birdQueue.map((bType, i) => (
                <span
                  key={i}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-stone-900 opacity-85"
                  style={{ backgroundColor: BIRD_CATALOG[bType].color }}
                  title={`Queued: ${BIRD_CATALOG[bType].name}`}
                />
              ))}
            </div>
            {currentBirdMeta && (
              <div className="hidden lg:block">
                <div className="text-xs font-bold text-amber-100 leading-tight whitespace-nowrap">
                  {currentBirdMeta.name} · <span className="text-amber-400">{currentBirdMeta.abilityName}</span>
                </div>
                <div className="text-[11px] text-amber-200/75 leading-tight whitespace-nowrap">
                  {currentBirdMeta.role}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top-Right Compact Utility Controls: Scout [Tab], Mute [M], Restart [R], Pause [P] */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            tabIndex={-1}
            aria-label={isOverview ? 'Return Camera to Slingshot (Tab)' : 'Scout Fortress Camera (Tab)'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleOverview();
            }}
            className={`h-10 px-3 rounded-xl border-2 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isOverview
                ? 'bg-amber-500 text-[#1b1410] border-amber-200'
                : 'bg-[#23160f]/90 text-amber-100 border-[#92400e] hover:border-amber-400'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2.2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20L16 16" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Scout [Tab]</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-10 h-10 rounded-xl border-2 border-[#92400e] bg-[#23160f]/90 hover:border-amber-400 text-amber-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Restart Stage (R)"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            className="w-10 h-10 rounded-xl border-2 border-[#92400e] bg-[#23160f]/90 hover:border-amber-400 text-amber-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" />
              <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Game (P)"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="w-10 h-10 rounded-xl border-2 border-[#92400e] bg-[#23160f]/90 hover:border-amber-400 text-amber-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
