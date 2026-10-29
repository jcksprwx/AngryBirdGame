import React from 'react';
import { LEVELS } from '../game/levels';
import { GameState, RunSnapshot } from '../game/types';

interface StatusModalProps {
  gameState: GameState;
  snapshot: RunSnapshot | null;
  onResume: () => void;
  onRestart: () => void;
  onNextStage: () => void;
  onReturnTitle: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  gameState,
  snapshot,
  onResume,
  onRestart,
  onNextStage,
  onReturnTitle,
}) => {
  if (gameState !== 'paused' && gameState !== 'gameover') return null;

  const isPaused = gameState === 'paused';
  const isVictory = snapshot?.outcome === 'victory';
  const hasNextStage = snapshot ? snapshot.levelId < LEVELS.length : false;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-6 pointer-events-auto"
      style={{ backgroundColor: 'rgba(14, 10, 7, 0.72)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
    >
      <div
        className="w-full max-w-md rounded-2xl border-3 border-[#b45309] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-center"
        style={{ backgroundColor: '#271911' }}
      >
        {isPaused ? (
          <>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
              SIEGE SUSPENDED
            </div>
            <h2
              id="modal-heading"
              className="text-3xl font-display font-extrabold text-amber-100 mb-6"
            >
              Game Paused
            </h2>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onResume();
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1b1410] font-display font-extrabold text-base border-2 border-amber-200 cursor-pointer transition-colors"
              >
                Resume Siege [Esc]
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRestart();
                }}
                className="w-full py-3 px-5 rounded-xl bg-[#3b2518] hover:bg-[#4c3020] text-amber-100 font-display font-bold text-sm border-2 border-[#78350f] cursor-pointer transition-colors"
              >
                Restart Stage [R]
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onReturnTitle();
                }}
                className="w-full py-3 px-5 rounded-xl bg-[#1c120c] hover:bg-[#291b12] text-amber-200/80 font-display font-semibold text-sm border border-[#57280e] cursor-pointer transition-colors"
              >
                Return to Title Screen
              </button>
            </div>
          </>
        ) : (
          snapshot && (
            <>
              <div
                className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                  isVictory ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isVictory ? `STAGE ${snapshot.levelId} CLEARED` : `STAGE ${snapshot.levelId} FAILED`}
              </div>
              <h2
                id="modal-heading"
                className="text-3xl font-display font-extrabold text-amber-100 mb-3"
              >
                {isVictory ? 'Fortress Demolished!' : 'Out of Striker Birds'}
              </h2>

              {/* Star Rating Display on Victory */}
              {isVictory && (
                <div className="flex items-center justify-center gap-3 my-4" aria-label={`${snapshot.stars} of 3 Stars`}>
                  {[1, 2, 3].map((starIdx) => {
                    const earned = starIdx <= snapshot.stars;
                    return (
                      <svg
                        key={starIdx}
                        viewBox="0 0 36 36"
                        className={`w-11 h-11 ${earned ? 'scale-105' : 'opacity-35'}`}
                      >
                        <polygon
                          points="18,3 22.6,12.4 33,13.9 25.5,21.2 27.3,31.5 18,26.6 8.7,31.5 10.5,21.2 3,13.9 13.4,12.4"
                          fill={earned ? '#fbbf24' : '#44403c'}
                          stroke="#1b1410"
                          strokeWidth="2.5"
                        />
                      </svg>
                    );
                  })}
                </div>
              )}

              {/* 3 Tabular-Nums Mastery / Progress Stat Tiles */}
              <div className="grid grid-cols-3 gap-2.5 my-5">
                <div className="p-3 rounded-xl bg-[#1c120c] border border-[#78350f]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                    SCORE / BEST
                  </div>
                  <div className="text-lg font-display font-extrabold text-amber-100 font-mono-tabular mt-0.5">
                    {Math.round(snapshot.score)}
                  </div>
                  <div className="text-[11px] text-amber-200/60 font-mono-tabular">
                    Best {Math.round(snapshot.bestScore)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#1c120c] border border-[#78350f]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                    BOARS CLEARED
                  </div>
                  <div className="text-lg font-display font-extrabold text-emerald-400 font-mono-tabular mt-0.5">
                    {snapshot.enemiesCleared}/{snapshot.totalEnemies}
                  </div>
                  <div className="text-[11px] text-amber-200/60 font-mono-tabular">
                    {snapshot.birdsRemaining} Birds Left
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#1c120c] border border-[#78350f]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                    DESTRUCTION
                  </div>
                  <div className="text-lg font-display font-extrabold text-amber-300 font-mono-tabular mt-0.5">
                    {Math.round(snapshot.destructionPercent)}%
                  </div>
                  <div className="text-[11px] text-amber-200/60 font-mono-tabular">
                    Fortress Damage
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {isVictory && hasNextStage ? (
                  <button
                    type="button"
                    data-start="true"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onNextStage();
                    }}
                    className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-extrabold text-base border-2 border-emerald-200 cursor-pointer transition-colors"
                  >
                    Next Siege Stage [Enter]
                  </button>
                ) : null}

                <button
                  type="button"
                  data-start={!isVictory || !hasNextStage ? 'true' : undefined}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onRestart();
                  }}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#e11d48] hover:bg-[#f43f5e] text-white font-display font-extrabold text-base border-2 border-rose-200 cursor-pointer transition-colors"
                >
                  {isVictory ? 'Replay Stage' : 'Try Again [Enter]'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onReturnTitle();
                  }}
                  className="w-full py-2.5 px-5 rounded-xl bg-[#1c120c] hover:bg-[#291b12] text-amber-200/80 font-display font-semibold text-sm border border-[#57280e] cursor-pointer transition-colors"
                >
                  Title Screen
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};
