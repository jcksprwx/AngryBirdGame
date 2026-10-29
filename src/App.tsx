/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HudOverlay } from './components/HudOverlay';
import { StatusModal } from './components/StatusModal';
import { TitleOverlay } from './components/TitleOverlay';
import { gameAudio } from './game/audio';
import { LEVELS } from './game/levels';
import { createSimulationWorld } from './game/physics';
import { BirdType, GameState, RunSnapshot, SimulationWorld } from './game/types';

export default function App() {
  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [gameState, setGameState] = useState<GameState>(initialAutostart ? 'playing' : 'title');
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [highestUnlockedLevel, setHighestUnlockedLevel] = useState<number>(5);
  const [bestScores, setBestScores] = useState<Record<number, number>>({
    1: 4200,
    2: 5100,
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);

  const worldRef = useRef<SimulationWorld>(createSimulationWorld(1));

  const [hudState, setHudState] = useState<{
    score: number;
    activeBirdType: BirdType | null;
    birdQueue: BirdType[];
    enemiesRemaining: number;
    totalEnemies: number;
    isOverview: boolean;
  }>(() => {
    const w = worldRef.current;
    return {
      score: 0,
      activeBirdType: w.activeBirds[0]?.type ?? 'crimson',
      birdQueue: [...w.birdQueue],
      enemiesRemaining: w.enemies.length,
      totalEnemies: w.enemies.length,
      isOverview: false,
    };
  });

  // Sync game state machine to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = gameState;
    if (gameState !== 'playing') {
      document.exitPointerLock?.();
    }
  }, [gameState]);

  const loadAndStartStage = useCallback((levelId: number) => {
    const freshWorld = createSimulationWorld(levelId);
    worldRef.current = freshWorld;
    setSelectedLevelId(levelId);
    setSnapshot(null);
    setHudState({
      score: 0,
      activeBirdType: freshWorld.activeBirds[0]?.type ?? null,
      birdQueue: [...freshWorld.birdQueue],
      enemiesRemaining: freshWorld.enemies.length,
      totalEnemies: freshWorld.enemies.length,
      isOverview: false,
    });
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, []);

  const handleSelectLevelOnTitle = useCallback((levelId: number) => {
    const freshWorld = createSimulationWorld(levelId);
    worldRef.current = freshWorld;
    setSelectedLevelId(levelId);
  }, []);

  const handleStartFromTitle = useCallback(() => {
    loadAndStartStage(selectedLevelId);
  }, [loadAndStartStage, selectedLevelId]);

  const handleOutcome = useCallback((runSnap: RunSnapshot) => {
    setSnapshot(runSnap);
    setBestScores((prev) => ({
      ...prev,
      [runSnap.levelId]: Math.max(prev[runSnap.levelId] ?? 0, runSnap.score),
    }));
    if (runSnap.outcome === 'victory') {
      setHighestUnlockedLevel((prev) => Math.min(LEVELS.length, Math.max(prev, runSnap.levelId + 1)));
    }
    document.body.dataset.state = 'gameover';
    setGameState('gameover');
  }, []);

  const handleToggleOverview = useCallback(() => {
    worldRef.current.cameraOverviewMode = !worldRef.current.cameraOverviewMode;
    setHudState((prev) => ({ ...prev, isOverview: worldRef.current.cameraOverviewMode }));
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = gameAudio.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const handleRestartStage = useCallback(() => {
    loadAndStartStage(selectedLevelId);
  }, [loadAndStartStage, selectedLevelId]);

  const handleNextStage = useCallback(() => {
    const nextId = Math.min(LEVELS.length, selectedLevelId + 1);
    loadAndStartStage(nextId);
  }, [loadAndStartStage, selectedLevelId]);

  const handleReturnTitle = useCallback(() => {
    const freshWorld = createSimulationWorld(selectedLevelId);
    worldRef.current = freshWorld;
    setSnapshot(null);
    document.body.dataset.state = 'title';
    setGameState('title');
  }, [selectedLevelId]);

  // Global keyboard shortcuts for Title Start, Pause [Esc/P], Restart [R], Mute [M], Scout [Tab]
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (gameState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartFromTitle();
        }
        return;
      }

      if (gameState === 'gameover') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          if (snapshot?.outcome === 'victory' && selectedLevelId < LEVELS.length) {
            handleNextStage();
          } else {
            handleRestartStage();
          }
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        setGameState((prev) => {
          const next = prev === 'playing' ? 'paused' : 'playing';
          document.body.dataset.state = next;
          return next;
        });
      } else if (e.code === 'KeyR' && (gameState === 'playing' || gameState === 'paused')) {
        e.preventDefault();
        handleRestartStage();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === 'Tab' && gameState === 'playing') {
        e.preventDefault();
        handleToggleOverview();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    snapshot,
    selectedLevelId,
    handleStartFromTitle,
    handleRestartStage,
    handleNextStage,
    handleToggleMute,
    handleToggleOverview,
  ]);

  return (
    <main className="relative w-full h-full overflow-hidden select-none">
      {/* Isolated 60fps Physics & Parallax Canvas */}
      <GameCanvas
        worldRef={worldRef}
        gameState={gameState}
        bestScores={bestScores}
        onHudSync={setHudState}
        onOutcome={handleOutcome}
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleOverlay
          selectedLevelId={selectedLevelId}
          highestUnlockedLevel={highestUnlockedLevel}
          bestScores={bestScores}
          onSelectLevel={handleSelectLevelOnTitle}
          onStartGame={handleStartFromTitle}
        />
      )}

      {/* World-Matched Gameplay HUD */}
      {gameState !== 'title' && (
        <HudOverlay
          levelId={selectedLevelId}
          score={hudState.score}
          bestScore={bestScores[selectedLevelId] ?? 0}
          activeBirdType={hudState.activeBirdType}
          birdQueue={hudState.birdQueue}
          enemiesRemaining={hudState.enemiesRemaining}
          totalEnemies={hudState.totalEnemies}
          isOverview={hudState.isOverview}
          isMuted={isMuted}
          onToggleOverview={handleToggleOverview}
          onToggleMute={handleToggleMute}
          onRestart={handleRestartStage}
          onPause={() => {
            document.body.dataset.state = 'paused';
            setGameState('paused');
          }}
        />
      )}

      {/* Single Focused Pause / Victory / Defeat Modal */}
      <StatusModal
        gameState={gameState}
        snapshot={snapshot}
        onResume={() => {
          document.body.dataset.state = 'playing';
          setGameState('playing');
        }}
        onRestart={handleRestartStage}
        onNextStage={handleNextStage}
        onReturnTitle={handleReturnTitle}
      />
    </main>
  );
}
