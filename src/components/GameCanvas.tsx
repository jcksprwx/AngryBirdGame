import React, { useEffect, useRef } from 'react';
import { gameAudio } from '../game/audio';
import {
  BIRD_CATALOG,
  GROUND_Y,
  LEVELS,
  MAX_PULL_RADIUS,
  SLINGSHOT_X,
  SLINGSHOT_Y,
} from '../game/levels';
import {
  calculateStarRating,
  clampSlingshotPull,
  computeTrajectoryPoints,
  launchLoadedBird,
  PhysicsEvents,
  stepSimulationWorld,
  triggerBirdAbility,
} from '../game/physics';
import {
  ActiveBird,
  BirdType,
  BlockEntity,
  EnemyEntity,
  GameState,
  RunSnapshot,
  SimulationWorld,
  Vec2,
} from '../game/types';

export const WORLD_WIDTH = 1440;
export const WORLD_HEIGHT = 760;

interface HudSyncPayload {
  score: number;
  activeBirdType: BirdType | null;
  birdQueue: BirdType[];
  enemiesRemaining: number;
  totalEnemies: number;
  isOverview: boolean;
}

interface GameCanvasProps {
  worldRef: React.MutableRefObject<SimulationWorld>;
  gameState: GameState;
  bestScores: Record<number, number>;
  onHudSync: (payload: HudSyncPayload) => void;
  onOutcome: (snapshot: RunSnapshot) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  worldRef,
  gameState,
  bestScores,
  onHudSync,
  onOutcome,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  const bestScoresRef = useRef<Record<number, number>>(bestScores);
  const onHudSyncRef = useRef(onHudSync);
  const onOutcomeRef = useRef(onOutcome);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    bestScoresRef.current = bestScores;
  }, [bestScores]);

  useEffect(() => {
    onHudSyncRef.current = onHudSync;
  }, [onHudSync]);

  useEffect(() => {
    onOutcomeRef.current = onOutcome;
  }, [onOutcome]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let canvasRect = canvas.getBoundingClientRect();
    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvasRect = canvas.getBoundingClientRect();
    };

    updateCanvasSize();
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(canvas);

    // Compute world coordinates from screen clientX/clientY
    const getViewportTransform = () => {
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / WORLD_WIDTH, ch / WORLD_HEIGHT);
      const offsetX = (cw - WORLD_WIDTH * scale) * 0.5;
      const offsetY = ch - WORLD_HEIGHT * scale;
      return { scale, offsetX, offsetY };
    };

    const screenToWorld = (clientX: number, clientY: number): Vec2 => {
      canvasRect = canvas.getBoundingClientRect();
      const dpr = canvas.width / Math.max(1, canvasRect.width);
      const px = (clientX - canvasRect.left) * dpr;
      const py = (clientY - canvasRect.top) * dpr;
      const { scale, offsetX, offsetY } = getViewportTransform();
      const world = worldRef.current;
      return {
        x: (px - offsetX) / scale + world.cameraX,
        y: (py - offsetY) / scale,
      };
    };

    // Unified Input State
    const keysHeld = new Set<string>();
    let isDraggingSlingshot = false;
    let pullPos: Vec2 = { x: SLINGSHOT_X - 72, y: SLINGSHOT_Y + 26 };
    let keyboardAimActive = false;
    let lastStretchSoundTime = 0;

    const clearHeldInputs = () => {
      keysHeld.clear();
      isDraggingSlingshot = false;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (gameStateRef.current !== 'playing') return;
      const world = worldRef.current;
      const pt = screenToWorld(e.clientX, e.clientY);

      // Check if an active bird is already mid-air -> trigger special ability on click!
      const flyingBird = world.activeBirds.find((b) => b.launched && !b.abilityUsed && b.alive);
      if (flyingBird) {
        const events: PhysicsEvents = {};
        if (triggerBirdAbility(world, events)) {
          if (events.abilityTriggered) gameAudio.playAbility(events.abilityTriggered);
          if (events.explosion) gameAudio.playExplosion();
        }
        return;
      }

      // Check if clicking near loaded bird on slingshot
      const loadedBird = world.activeBirds.find((b) => !b.launched && b.alive);
      if (loadedBird) {
        const dist = Math.hypot(pt.x - world.slingshotPos.x, pt.y - world.slingshotPos.y);
        if (dist <= 135) {
          isDraggingSlingshot = true;
          keyboardAimActive = false;
          world.cameraOverviewMode = false;
          pullPos = clampSlingshotPull(world.slingshotPos, pt);
          loadedBird.x = pullPos.x;
          loadedBird.y = pullPos.y;
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingSlingshot || gameStateRef.current !== 'playing') return;
      const world = worldRef.current;
      const pt = screenToWorld(e.clientX, e.clientY);
      pullPos = clampSlingshotPull(world.slingshotPos, pt);
      const loadedBird = world.activeBirds.find((b) => !b.launched && b.alive);
      if (loadedBird) {
        loadedBird.x = pullPos.x;
        loadedBird.y = pullPos.y;
        const tension = Math.hypot(
          pullPos.x - world.slingshotPos.x,
          pullPos.y - world.slingshotPos.y
        ) / MAX_PULL_RADIUS;
        if (performance.now() - lastStretchSoundTime > 95 && tension > 0.2) {
          lastStretchSoundTime = performance.now();
          gameAudio.playStretchCreak(tension);
        }
      }
    };

    const handlePointerUp = () => {
      if (!isDraggingSlingshot) return;
      isDraggingSlingshot = false;
      if (gameStateRef.current !== 'playing') return;

      const world = worldRef.current;
      const events: PhysicsEvents = {};
      const didLaunch = launchLoadedBird(world, pullPos, events);
      if (didLaunch && events.launched) {
        gameAudio.playLaunch(events.launched);
      } else {
        // Snap bird back to slingshot rest position
        const loadedBird = world.activeBirds.find((b) => !b.launched && b.alive);
        if (loadedBird) {
          loadedBird.x = world.slingshotPos.x;
          loadedBird.y = world.slingshotPos.y;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing') return;
      const code = e.code;

      if (!e.repeat && (code === 'Space' || code === 'Enter')) {
        e.preventDefault();
        const world = worldRef.current;
        const flyingBird = world.activeBirds.find((b) => b.launched && !b.abilityUsed && b.alive);
        if (flyingBird) {
          const events: PhysicsEvents = {};
          if (triggerBirdAbility(world, events)) {
            if (events.abilityTriggered) gameAudio.playAbility(events.abilityTriggered);
            if (events.explosion) gameAudio.playExplosion();
          }
          return;
        }

        const loadedBird = world.activeBirds.find((b) => !b.launched && b.alive);
        if (loadedBird) {
          if (!keyboardAimActive && !isDraggingSlingshot) {
            // Default sweet-spot pull when pressing Space directly
            pullPos = { x: world.slingshotPos.x - 86, y: world.slingshotPos.y + 34 };
          }
          const events: PhysicsEvents = {};
          if (launchLoadedBird(world, pullPos, events) && events.launched) {
            keyboardAimActive = false;
            gameAudio.playLaunch(events.launched);
          }
        }
      }

      if (
        code === 'KeyW' ||
        code === 'KeyS' ||
        code === 'KeyA' ||
        code === 'KeyD' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        keysHeld.add(code);
        keyboardAimActive = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) clearHeldInputs();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearHeldInputs);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Throttle HUD state synchronization
    let lastHudSignature = '';
    let lastFrameTime = performance.now();
    let titlePanTime = 0;
    let timerId = 0;
    let rafId = 0;
    let disposed = false;

    const scheduleNextFrame = () => {
      if (disposed) return;
      timerId = window.setTimeout(() => {
        if (!disposed) {
          rafId = requestAnimationFrame(renderLoop);
        }
      }, 28);
    };

    const renderLoop = (now: number) => {
      if (disposed) return;
      const rawDt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      const world = worldRef.current;
      const state = gameStateRef.current;

      if (state === 'title') {
        // Live World Camera Tour / Parallax Pan across the fortress stage
        titlePanTime += dt;
        world.cameraX = 140 + Math.sin(titlePanTime * 0.45) * 140;
      } else if (state === 'playing') {
        // Keyboard aiming adjustment
        const loadedBird = world.activeBirds.find((b) => !b.launched && b.alive);
        if (loadedBird && keyboardAimActive && !isDraggingSlingshot) {
          const aimSpeed = 140 * dt;
          if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft')) pullPos.x -= aimSpeed;
          if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight')) pullPos.x += aimSpeed;
          if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp')) pullPos.y -= aimSpeed;
          if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) pullPos.y += aimSpeed;
          pullPos = clampSlingshotPull(world.slingshotPos, pullPos);
          loadedBird.x = pullPos.x;
          loadedBird.y = pullPos.y;
        }

        const events: PhysicsEvents = {};
        stepSimulationWorld(world, dt, events);

        if (events.materialHit) {
          gameAudio.playMaterialHit(events.materialHit.material, events.materialHit.intensity);
        }
        if (events.explosion) {
          gameAudio.playExplosion();
        }
        if (events.enemyHit) {
          gameAudio.playEnemyHit(events.enemyHit.type, events.enemyHit.killed);
        }
        if (events.enemyWindup) {
          gameAudio.playEnemyWindup();
        }

        // Sync HUD only when discrete values change
        const currentBird = world.activeBirds[0]?.alive ? world.activeBirds[0].type : null;
        const enemiesAlive = world.enemies.filter((e) => !e.destroyed).length;
        const sig = `${Math.round(world.score)}|${currentBird}|${world.birdQueue.join(',')}|${enemiesAlive}|${world.cameraOverviewMode}`;
        if (sig !== lastHudSignature) {
          lastHudSignature = sig;
          onHudSyncRef.current({
            score: Math.round(world.score),
            activeBirdType: currentBird,
            birdQueue: [...world.birdQueue],
            enemiesRemaining: enemiesAlive,
            totalEnemies: world.enemies.length,
            isOverview: world.cameraOverviewMode,
          });
        }

        if (events.outcome) {
          const level = LEVELS.find((l) => l.id === world.levelId) ?? LEVELS[0];
          const finalScore = Math.round(world.score);
          const prevBest = bestScoresRef.current[world.levelId] ?? 0;
          const newBest = Math.max(finalScore, prevBest);
          const unlaunched = world.activeBirds.some((b) => !b.launched && b.alive) ? 1 : 0;
          const brokenBlocks = world.blocks.filter((b) => b.destroyed).length;
          const destructionPct =
            world.initialBlockCount > 0 ? (brokenBlocks / world.initialBlockCount) * 100 : 100;

          gameAudio.playOutcome(events.outcome);
          onOutcomeRef.current({
            outcome: events.outcome,
            levelId: world.levelId,
            levelName: level.name,
            score: finalScore,
            bestScore: newBest,
            stars: events.outcome === 'victory' ? calculateStarRating(world.levelId, finalScore) : 0,
            birdsRemaining: world.birdQueue.length + unlaunched,
            enemiesCleared: world.enemies.filter((e) => e.destroyed).length,
            totalEnemies: world.enemies.length,
            destructionPercent: destructionPct,
          });
        }
      }

      // Draw Scene
      drawWorld(
        ctx,
        canvas.width,
        canvas.height,
        world,
        isDraggingSlingshot || keyboardAimActive,
        pullPos,
        now / 1000
      );

      scheduleNextFrame();
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      disposed = true;
      clearTimeout(timerId);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearHeldInputs);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [worldRef]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#161922]">
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        className="block w-full h-full cursor-crosshair touch-none"
      />
    </div>
  );
};

function drawWorld(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  world: SimulationWorld,
  showAimingArc: boolean,
  pullPos: Vec2,
  timeSec: number
): void {
  ctx.save();

  // Golden-hour alpine sky gradient (calm low-detail upper-left negative space for Title)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, ch);
  skyGrad.addColorStop(0, '#1e293b');
  skyGrad.addColorStop(0.42, '#475569');
  skyGrad.addColorStop(0.76, '#f59e0b');
  skyGrad.addColorStop(1, '#fde68a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, cw, ch);

  const scale = Math.max(cw / WORLD_WIDTH, ch / WORLD_HEIGHT);
  const offsetX = (cw - WORLD_WIDTH * scale) * 0.5;
  const offsetY = ch - WORLD_HEIGHT * scale;

  // Decaying trauma * trauma camera shake
  const shakeMag = world.cameraTrauma * world.cameraTrauma * 14;
  const shakeX = (Math.sin(timeSec * 53) + Math.cos(timeSec * 37)) * 0.5 * shakeMag;
  const shakeY = (Math.cos(timeSec * 47) - Math.sin(timeSec * 61)) * 0.5 * shakeMag;

  ctx.translate(offsetX + shakeX * scale, offsetY + shakeY * scale);
  ctx.scale(scale, scale);

  // Parallax Layer 1: Warm Sunset Sun & Distant Alpine Peaks (0.2x cameraX)
  ctx.save();
  ctx.translate(-world.cameraX * 0.18, 0);
  ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
  ctx.beginPath();
  ctx.arc(1060, 220, 115, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(-200, GROUND_Y);
  ctx.lineTo(140, 320);
  ctx.lineTo(440, 470);
  ctx.lineTo(780, 250);
  ctx.lineTo(1140, 440);
  ctx.lineTo(1490, 270);
  ctx.lineTo(1850, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Parallax Layer 2: Midground Highland Ridge & Pine Silhouettes (0.45x cameraX)
  ctx.save();
  ctx.translate(-world.cameraX * 0.45, 0);
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-200, GROUND_Y);
  ctx.quadraticCurveTo(220, 430, 620, 520);
  ctx.quadraticCurveTo(1040, 390, 1520, 500);
  ctx.lineTo(1900, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Swaying Pine Trees
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 18; i++) {
    const tx = i * 105 - 60;
    const sway = Math.sin(timeSec * 1.4 + i) * 3;
    const treeH = 52 + (i % 3) * 18;
    ctx.beginPath();
    ctx.moveTo(tx + sway, GROUND_Y - treeH);
    ctx.lineTo(tx - 18, GROUND_Y);
    ctx.lineTo(tx + 18, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Foreground Camera World Space
  ctx.save();
  ctx.translate(-world.cameraX, 0);

  // Queued Birds waiting patiently behind the slingshot
  world.birdQueue.forEach((bType, idx) => {
    const qx = SLINGSHOT_X - 68 - idx * 42;
    const bob = Math.abs(Math.sin(timeSec * 3.2 + idx * 1.1)) * 5;
    const qy = GROUND_Y - BIRD_CATALOG[bType].radius - bob;
    drawBirdSprite(ctx, {
      id: -idx,
      type: bType,
      x: qx,
      y: qy,
      vx: 0,
      vy: 0,
      radius: BIRD_CATALOG[bType].radius,
      mass: 1,
      rotation: 0,
      angularVelocity: 0,
      launched: false,
      abilityUsed: false,
      hitFlash: 0,
      scaleX: 1,
      scaleY: 1,
      restTimer: 0,
      alive: true,
      trail: [],
    });
  });

  // Back Fork of Carved Oak Slingshot + Back Elastic Band
  const loadedBird = world.activeBirds.find((b) => !b.launched && b.alive);
  drawSlingshotBack(ctx, world.slingshotPos, loadedBird);

  // Aiming Trajectory Dotted Curve & Gaze-Routed Tension Readout
  if (showAimingArc && loadedBird) {
    const pts = computeTrajectoryPoints(world.slingshotPos, pullPos, 24, 0.045);
    const meta = BIRD_CATALOG[loadedBird.type];
    pts.forEach((pt, idx) => {
      const alpha = Math.max(0.15, 1 - idx / pts.length);
      ctx.fillStyle = meta.accent;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, idx % 2 === 0 ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Gaze-routed pull tension meter right beneath the slingshot pouch
    const pullDist = Math.hypot(
      pullPos.x - world.slingshotPos.x,
      pullPos.y - world.slingshotPos.y
    );
    const pct = Math.min(100, Math.round((pullDist / MAX_PULL_RADIUS) * 100));
    if (pct > 12) {
      ctx.fillStyle = 'rgba(27, 20, 16, 0.85)';
      ctx.beginPath();
      ctx.roundRect(loadedBird.x - 28, loadedBird.y + loadedBird.radius + 10, 56, 20, 6);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${pct}%`, loadedBird.x, loadedBird.y + loadedBird.radius + 24);
    }
  }

  // Front Fork of Carved Oak Slingshot (drawn behind resting bird, or with stretched band when pulled)
  drawSlingshotFront(ctx, world.slingshotPos, loadedBird);

  // Draw Bird Flight Trails & Active Birds
  for (const bird of world.activeBirds) {
    if (bird.trail.length > 1) {
      for (let i = 0; i < bird.trail.length; i++) {
        const pt = bird.trail[i];
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, (i / bird.trail.length) * 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (bird.alive) {
      drawBirdSprite(ctx, bird);
    }
  }

  // When pulled back, draw front elastic strap & pouch over the bird's back edge
  if (
    loadedBird &&
    Math.hypot(loadedBird.x - world.slingshotPos.x, loadedBird.y - world.slingshotPos.y) > 6
  ) {
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(loadedBird.x - 6, loadedBird.y + 4, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3b1d0b';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(world.slingshotPos.x - 14, world.slingshotPos.y - 4);
    ctx.lineTo(loadedBird.x - 6, loadedBird.y + 4);
    ctx.stroke();
  }

  // Draw Fortress Blocks
  for (const block of world.blocks) {
    if (!block.destroyed) {
      drawBlockEntity(ctx, block);
    }
  }

  // Draw Boar Enemies & Visible Windup Telegraphs
  for (const enemy of world.enemies) {
    if (!enemy.destroyed) {
      drawEnemyEntity(ctx, enemy, timeSec);
    }
  }

  // Draw Pooled Particles
  for (const p of world.particles) {
    if (!p.active) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.shape === 'ring') {
      const currentR = p.size * (0.25 + 0.75 * (p.life / p.maxLife));
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 5 * p.alpha;
      ctx.beginPath();
      ctx.arc(0, 0, currentR, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.shape === 'shard') {
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size * 0.6, -p.size * 0.4, p.size * 1.2, p.size * 0.8);
    } else if (p.shape === 'feather') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.2, p.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw Floating Score / Ability Popups
  for (const pop of world.popups) {
    const alpha = Math.max(0, 1 - pop.life / pop.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '800 18px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1b1410';
    ctx.strokeText(pop.text, pop.x, pop.y);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);
    ctx.restore();
  }

  // Draw Highland Turf & Bedrock Ground
  ctx.fillStyle = '#292524';
  ctx.fillRect(-400, GROUND_Y, 2600, 220);
  ctx.fillStyle = '#15803d';
  ctx.fillRect(-400, GROUND_Y, 2600, 16);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(-400, GROUND_Y, 2600, 6);

  // Slingshot Cobblestone Pedestal Mound
  ctx.fillStyle = '#57534e';
  ctx.beginPath();
  ctx.arc(SLINGSHOT_X, GROUND_Y + 12, 48, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}

function drawSlingshotBack(
  ctx: CanvasRenderingContext2D,
  anchor: Vec2,
  loadedBird?: ActiveBird
): void {
  // Back right wooden fork prong
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(anchor.x, anchor.y + 38);
  ctx.lineTo(anchor.x + 16, anchor.y - 6);
  ctx.stroke();

  if (loadedBird) {
    ctx.strokeStyle = '#291509';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(anchor.x + 15, anchor.y - 4);
    ctx.lineTo(loadedBird.x, loadedBird.y);
    ctx.stroke();
  }
}

function drawSlingshotFront(
  ctx: CanvasRenderingContext2D,
  anchor: Vec2,
  _loadedBird?: ActiveBird
): void {
  // Main carved oak Y-trunk and front fork prong
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(anchor.x, GROUND_Y - 8);
  ctx.lineTo(anchor.x, anchor.y + 34);
  ctx.lineTo(anchor.x - 15, anchor.y - 6);
  ctx.stroke();

  // Dark outline & brass collar band
  ctx.fillStyle = '#d97706';
  ctx.fillRect(anchor.x - 10, anchor.y + 32, 20, 8);
}

function drawBirdSprite(ctx: CanvasRenderingContext2D, bird: ActiveBird): void {
  const meta = BIRD_CATALOG[bird.type];
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);
  ctx.scale(bird.scaleX, bird.scaleY);

  const r = bird.radius;
  const isFlash = bird.hitFlash > 0;

  // Tail feathers
  ctx.fillStyle = '#1b1410';
  ctx.beginPath();
  ctx.moveTo(-r + 2, 0);
  ctx.lineTo(-r - 9, -7);
  ctx.lineTo(-r - 7, 0);
  ctx.lineTo(-r - 9, 6);
  ctx.closePath();
  ctx.fill();

  // Main Body Silhouette
  ctx.fillStyle = isFlash ? '#ffffff' : meta.color;
  ctx.strokeStyle = '#1b1410';
  ctx.lineWidth = 3;

  if (bird.type === 'gale') {
    // Triangular aerodynamic falcon silhouette
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.15);
    ctx.lineTo(r * 1.15, r * 0.85);
    ctx.lineTo(-r * 1.1, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Belly highlight patch
  ctx.fillStyle = isFlash ? '#ffffff' : meta.accent;
  ctx.beginPath();
  ctx.ellipse(2, r * 0.42, r * 0.58, r * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bomb fuse on Amber Bombardier
  if (bird.type === 'amber') {
    ctx.strokeStyle = '#1b1410';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(4, -r - 10);
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(5, -r - 12, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1b1410';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(r * 0.12, -2, r * 0.24, 0, Math.PI * 2);
  ctx.arc(r * 0.52, -2, r * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1b1410';
  ctx.beginPath();
  ctx.arc(r * 0.18, -2, r * 0.11, 0, Math.PI * 2);
  ctx.arc(r * 0.56, -2, r * 0.11, 0, Math.PI * 2);
  ctx.fill();

  // Determined Eyebrows
  ctx.fillStyle = '#1b1410';
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, -r * 0.38);
  ctx.lineTo(r * 0.34, -r * 0.16);
  ctx.lineTo(r * 0.34, -r * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(r * 0.78, -r * 0.38);
  ctx.lineTo(r * 0.36, -r * 0.16);
  ctx.lineTo(r * 0.36, -r * 0.3);
  ctx.closePath();
  ctx.fill();

  // Sharp Golden Beak
  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#1b1410';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r * 0.3, 1);
  ctx.lineTo(r * 0.98, 5);
  ctx.lineTo(r * 0.3, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawBlockEntity(ctx: CanvasRenderingContext2D, block: BlockEntity): void {
  ctx.save();
  ctx.translate(block.x, block.y);
  ctx.rotate(block.rotation);

  const w = block.width;
  const h = block.height;
  const hw = w / 2;
  const hh = h / 2;
  const isFlash = block.hitFlash > 0;

  if (isFlash) {
    ctx.fillStyle = '#ffffff';
  } else if (block.material === 'wood') {
    ctx.fillStyle = '#b45309';
  } else if (block.material === 'ice') {
    ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
  } else if (block.material === 'stone') {
    ctx.fillStyle = '#78716c';
  } else {
    ctx.fillStyle = '#dc2626';
  }

  ctx.strokeStyle = '#1b1410';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-hw, -hh, w, h, 3);
  ctx.fill();
  ctx.stroke();

  // Material interior structural details
  if (!isFlash) {
    if (block.material === 'wood') {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-hw + 4, -hh + 5);
      ctx.lineTo(hw - 4, -hh + 5);
      ctx.moveTo(-hw + 4, hh - 5);
      ctx.lineTo(hw - 4, hh - 5);
      ctx.stroke();
    } else if (block.material === 'ice') {
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-hw + 5, -hh + 5);
      ctx.lineTo(hw - 6, -hh + 5);
      ctx.stroke();
    } else if (block.material === 'tnt') {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-hw + 4, -8, w - 8, 16);
      ctx.fillStyle = '#1b1410';
      ctx.font = '800 11px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TNT', 0, 4);
    }
  }

  // Damage cracks when HP < 75%
  const hpRatio = block.hp / block.maxHp;
  if (hpRatio < 0.75) {
    ctx.strokeStyle = '#1b1410';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.4, -hh);
    ctx.lineTo(0, 0);
    ctx.lineTo(hw * 0.45, hh * 0.6);
    if (hpRatio < 0.4) {
      ctx.moveTo(hw * 0.3, -hh * 0.7);
      ctx.lineTo(0, 0);
      ctx.lineTo(-hw * 0.5, hh * 0.5);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawEnemyEntity(ctx: CanvasRenderingContext2D, enemy: EnemyEntity, timeSec: number): void {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.rotation);

  const r = enemy.radius;
  const isFlash = enemy.hitFlash > 0;

  // Visible Windup Telegraph Ring (0.6-0.75s warning before shield/rally)
  if (enemy.behaviorState === 'windup') {
    const pulse = 1 + Math.sin(timeSec * 24) * 0.12;
    ctx.strokeStyle = enemy.type === 'king' ? '#facc15' : '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.42 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Squat/Duck scale when Grunt evades or King braces
  const sy = enemy.behaviorState === 'active' && enemy.type === 'grunt' ? 0.84 : 1;
  const sx = enemy.behaviorState === 'active' && enemy.type === 'grunt' ? 1.14 : 1;
  ctx.scale(sx, sy);

  // Ears
  ctx.fillStyle = isFlash ? '#ffffff' : '#22c55e';
  ctx.strokeStyle = '#1b1410';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(-r * 0.72, -r * 0.68, r * 0.26, 0, Math.PI * 2);
  ctx.arc(r * 0.72, -r * 0.68, r * 0.26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Main Green Boar Body
  ctx.fillStyle = isFlash ? '#ffffff' : '#22c55e';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Iron Helmet on 'helmet' archetype
  if (enemy.type === 'helmet') {
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(0, -2, r * 1.04, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Golden Crown on 'king' archetype
  if (enemy.type === 'king') {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, -r * 0.78);
    ctx.lineTo(-r * 0.45, -r * 1.32);
    ctx.lineTo(-r * 0.15, -r * 0.95);
    ctx.lineTo(0, -r * 1.42);
    ctx.lineTo(r * 0.15, -r * 0.95);
    ctx.lineTo(r * 0.45, -r * 1.32);
    ctx.lineTo(r * 0.65, -r * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Snout
  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.ellipse(0, 3, r * 0.46, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Nostrils
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.arc(-r * 0.16, 3, r * 0.09, 0, Math.PI * 2);
  ctx.arc(r * 0.16, 3, r * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (bruised if damaged)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-r * 0.42, -r * 0.18, r * 0.2, 0, Math.PI * 2);
  ctx.arc(r * 0.42, -r * 0.18, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1b1410';
  ctx.beginPath();
  ctx.arc(-r * 0.42, -r * 0.18, r * 0.09, 0, Math.PI * 2);
  ctx.arc(r * 0.42, -r * 0.18, r * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // Active frontal iron buckler shield when 'helmet' braces
  if (enemy.shieldActive) {
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-r * 1.15, -r * 0.55, 9, r * 1.1, 4);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}
