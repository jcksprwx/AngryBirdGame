import React from 'react';
import { LEVELS } from '../game/levels';

interface TitleOverlayProps {
  selectedLevelId: number;
  highestUnlockedLevel: number;
  bestScores: Record<number, number>;
  onSelectLevel: (id: number) => void;
  onStartGame: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  selectedLevelId,
  highestUnlockedLevel,
  bestScores,
  onSelectLevel,
  onStartGame,
}) => {
  const activeLevel = LEVELS.find((l) => l.id === selectedLevelId) ?? LEVELS[0];

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-8 md:p-12 pointer-events-none"
      aria-label="Title Screen"
    >
      {/* Top-Left Asymmetric Negative Space Composition (35% sky negative space) */}
      <div className="max-w-[540px] pointer-events-auto">
        {/* Bespoke Inline SVG Title Emblem Lockup */}
        <div className="mb-5">
          <svg
            viewBox="0 0 570 145"
            className="w-full max-w-[520px] h-auto drop-shadow-[0_6px_16px_rgba(15,10,5,0.75)]"
            role="img"
            aria-label="Feather and Fury: Siege of Cragkeep"
          >
            {/* Carved Timber & Brass Heraldic Banner Backing */}
            <path
              d="M16 28 L542 20 L558 76 L536 122 L22 128 L6 78 Z"
              fill="#271911"
              stroke="#d97706"
              strokeWidth="4"
            />
            <path
              d="M24 35 L534 28 L547 76 L528 114 L29 120 L16 78 Z"
              fill="#3b2518"
              stroke="#78350f"
              strokeWidth="2"
            />
            {/* Corner Brass Rivets */}
            <circle cx="34" cy="46" r="4.5" fill="#fbbf24" />
            <circle cx="524" cy="40" r="4.5" fill="#fbbf24" />
            <circle cx="38" cy="108" r="4.5" fill="#fbbf24" />
            <circle cx="518" cy="102" r="4.5" fill="#fbbf24" />

            {/* Stylized Crimson Striker Crest Silhouette on Left */}
            <g transform="translate(46, 36)">
              <circle cx="36" cy="38" r="32" fill="#e11d48" stroke="#1b1410" strokeWidth="4" />
              <path d="M18 14 L34 22 L26 6 Z" fill="#e11d48" stroke="#1b1410" strokeWidth="3" />
              <ellipse cx="38" cy="54" rx="20" ry="12" fill="#ffe4e6" />
              {/* Fierce Eyebrows & Eyes */}
              <circle cx="30" cy="34" r="5.5" fill="#ffffff" stroke="#1b1410" strokeWidth="2" />
              <circle cx="48" cy="34" r="5.5" fill="#ffffff" stroke="#1b1410" strokeWidth="2" />
              <circle cx="32" cy="34" r="2.6" fill="#1b1410" />
              <circle cx="49" cy="34" r="2.6" fill="#1b1410" />
              <path d="M18 25 L36 31 L36 26 L18 20 Z" fill="#1b1410" />
              <path d="M58 25 L41 31 L41 26 L58 20 Z" fill="#1b1410" />
              {/* Golden Beak */}
              <polygon points="36,36 58,42 36,49" fill="#fbbf24" stroke="#1b1410" strokeWidth="2.5" />
            </g>

            {/* Primary Display Lockup Text */}
            <text
              x="136"
              y="74"
              fontFamily="Outfit, sans-serif"
              fontWeight="800"
              fontSize="43"
              letterSpacing="1"
              fill="#fef3c7"
              stroke="#1b1410"
              strokeWidth="7"
              paintOrder="stroke fill"
            >
              FEATHER &amp; FURY
            </text>
            <text
              x="138"
              y="105"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="700"
              fontSize="16"
              letterSpacing="3.5"
              fill="#fbbf24"
            >
              SIEGE OF CRAGKEEP
            </text>
          </svg>
        </div>

        {/* Stage Selection Strip (World-Matched Timber Plaque) */}
        <div
          className="p-4 rounded-xl border-2 border-[#78350f] shadow-[0_10px_28px_rgba(0,0,0,0.65)] mb-5"
          style={{ backgroundColor: 'rgba(35, 22, 15, 0.94)' }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
              Select Siege Stage
            </span>
            <span className="text-xs text-amber-200/80 font-mono-tabular">
              Stage {activeLevel.id} of {LEVELS.length}
              {bestScores[activeLevel.id] ? ` · Best ${Math.round(bestScores[activeLevel.id])}` : ''}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-3" role="group" aria-label="Siege Stages">
            {LEVELS.map((lvl) => {
              const unlocked = lvl.id <= highestUnlockedLevel;
              const isSelected = lvl.id === selectedLevelId;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectLevel(lvl.id);
                  }}
                  aria-label={`Stage ${lvl.id}: ${lvl.name}`}
                  className={`py-2 px-2.5 rounded-lg font-display font-bold text-xs transition-transform whitespace-nowrap shrink-0 border-2 ${
                    isSelected
                      ? 'bg-amber-500 text-[#1b1410] border-amber-200 scale-[1.03] shadow-md'
                      : unlocked
                      ? 'bg-[#3b2518] text-amber-100 border-[#78350f] hover:border-amber-400'
                      : 'bg-[#1f1610] text-stone-500 border-stone-800 cursor-not-allowed opacity-60'
                  }`}
                >
                  {lvl.id}. {lvl.name.split(' ')[0]}
                </button>
              );
            })}
          </div>

          <div className="text-sm font-semibold text-amber-100 mb-0.5">{activeLevel.name}</div>
          <p className="text-xs text-amber-200/75 leading-relaxed">{activeLevel.subtitle}</p>
        </div>

        {/* Primary Start Action Button */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartGame();
            }}
            className="px-8 py-4 rounded-xl bg-[#e11d48] hover:bg-[#f43f5e] active:scale-95 text-white font-display font-extrabold text-xl tracking-wide border-2 border-rose-200 shadow-[0_6px_0_#881337,0_12px_24px_rgba(0,0,0,0.6)] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Launch Siege
          </button>
        </div>
      </div>

      {/* Bottom Safe Margin: Single Flat Borderless Control-Hint Line */}
      <div className="w-full flex items-center justify-between text-xs font-semibold tracking-wide text-amber-100/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
        <span>
          Drag Slingshot or WASD / Arrows Aim · Space Launch &amp; Trigger Bird Ability · Tab Scout Fortress · Esc Pause
        </span>
        <span className="hidden sm:inline font-mono-tabular text-amber-300">
          Press Enter or Space to Start
        </span>
      </div>
    </div>
  );
};
