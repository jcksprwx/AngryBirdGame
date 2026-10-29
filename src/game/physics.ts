import {
  BIRD_CATALOG,
  GROUND_Y,
  LAUNCH_POWER,
  LEVELS,
  MAX_PULL_RADIUS,
  SLINGSHOT_X,
  SLINGSHOT_Y,
} from './levels';
import {
  ActiveBird,
  BirdType,
  BlockEntity,
  EnemyEntity,
  EnemyType,
  MaterialType,
  PooledParticle,
  SimulationWorld,
  Vec2,
} from './types';

export const MAX_PARTICLES = 180;
export const GRAVITY = 780; // px/s^2

export interface PhysicsEvents {
  launched?: BirdType;
  abilityTriggered?: BirdType;
  materialHit?: { material: MaterialType; intensity: number };
  blockDestroyed?: MaterialType;
  explosion?: Vec2;
  enemyHit?: { type: EnemyType; killed: boolean };
  enemyWindup?: EnemyType;
  outcome?: 'victory' | 'defeat';
}

export function getMaterialStats(material: MaterialType): { maxHp: number; mass: number; scoreValue: number } {
  switch (material) {
    case 'ice':
      return { maxHp: 55, mass: 1.0, scoreValue: 250 };
    case 'wood':
      return { maxHp: 90, mass: 1.35, scoreValue: 300 };
    case 'stone':
      return { maxHp: 175, mass: 2.4, scoreValue: 450 };
    case 'tnt':
      return { maxHp: 35, mass: 1.1, scoreValue: 600 };
  }
}

export function getEnemyStats(type: EnemyType): { maxHp: number; scoreValue: number } {
  switch (type) {
    case 'grunt':
      return { maxHp: 50, scoreValue: 1000 };
    case 'helmet':
      return { maxHp: 105, scoreValue: 1500 };
    case 'king':
      return { maxHp: 190, scoreValue: 3000 };
  }
}

export function createParticlePool(): PooledParticle[] {
  const pool: PooledParticle[] = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    pool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      color: '#ffffff',
      alpha: 1,
      life: 0,
      maxLife: 0.5,
      gravity: 400,
      shape: 'circle',
      rotation: 0,
      vRot: 0,
    });
  }
  return pool;
}

export function spawnPooledParticle(
  world: SimulationWorld,
  opts: Partial<PooledParticle> & { x: number; y: number }
): void {
  const p = world.particles[world.particleCursor];
  world.particleCursor = (world.particleCursor + 1) % world.particles.length;
  p.active = true;
  p.x = opts.x;
  p.y = opts.y;
  p.vx = opts.vx ?? 0;
  p.vy = opts.vy ?? 0;
  p.size = opts.size ?? 5;
  p.color = opts.color ?? '#fbbf24';
  p.alpha = 1;
  p.life = 0;
  p.maxLife = opts.maxLife ?? 0.55;
  p.gravity = opts.gravity ?? 420;
  p.shape = opts.shape ?? 'circle';
  p.rotation = opts.rotation ?? 0;
  p.vRot = opts.vRot ?? 0;
}

export function addPopup(world: SimulationWorld, x: number, y: number, text: string, color = '#fde68a'): void {
  world.popups.push({
    id: Math.round(world.simTime * 10000) + world.popups.length,
    x,
    y,
    text,
    color,
    life: 0,
    maxLife: 0.95,
  });
}

let nextEntityId = 1;

export function spawnActiveBird(type: BirdType, x: number, y: number): ActiveBird {
  const meta = BIRD_CATALOG[type];
  return {
    id: nextEntityId++,
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: meta.radius,
    mass: meta.mass,
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
  };
}

export function createSimulationWorld(levelId: number): SimulationWorld {
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
  const queue = [...level.birds];
  const firstType = queue.shift() ?? 'crimson';

  const blocks: BlockEntity[] = level.blocks.map((b) => {
    const stats = getMaterialStats(b.material);
    return {
      id: nextEntityId++,
      material: b.material,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      vx: 0,
      vy: 0,
      rotation: 0,
      angularVelocity: 0,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      mass: stats.mass * ((b.width * b.height) / 2200),
      hitFlash: 0,
      sleeping: true,
      destroyed: false,
    };
  });

  const enemies: EnemyEntity[] = level.enemies.map((e, idx) => {
    const stats = getEnemyStats(e.type);
    return {
      id: nextEntityId++,
      type: e.type,
      x: e.x,
      y: e.y,
      vx: 0,
      vy: 0,
      radius: e.radius ?? (e.type === 'king' ? 34 : e.type === 'helmet' ? 26 : 23),
      rotation: 0,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      hitFlash: 0,
      behaviorState: 'idle',
      behaviorTimer: 1.5 + idx * 0.7,
      shieldActive: false,
      koTimer: 0,
      destroyed: false,
    };
  });

  const totalEnemyHp = enemies.reduce((sum, e) => sum + e.maxHp, 0);

  return {
    levelId: level.id,
    groundY: GROUND_Y,
    slingshotPos: { x: SLINGSHOT_X, y: SLINGSHOT_Y },
    birdQueue: queue,
    activeBirds: [spawnActiveBird(firstType, SLINGSHOT_X, SLINGSHOT_Y)],
    blocks,
    enemies,
    particles: createParticlePool(),
    particleCursor: 0,
    popups: [],
    score: 0,
    initialTotalEnemyHp: totalEnemyHp,
    initialBlockCount: blocks.length,
    hitstopTimer: 0,
    cameraTrauma: 0,
    cameraX: 0,
    cameraTargetX: 0,
    cameraOverviewMode: false,
    settleTimer: 0,
    nextBirdTimer: 0,
    outcomePending: 'none',
    outcomeDelayTimer: 0,
    simTime: 0,
  };
}

/**
 * Clamps a pull point around the slingshot anchor within MAX_PULL_RADIUS.
 */
export function clampSlingshotPull(anchor: Vec2, pointerWorld: Vec2): Vec2 {
  const dx = pointerWorld.x - anchor.x;
  const dy = pointerWorld.y - anchor.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { x: anchor.x, y: anchor.y };
  const clamped = Math.min(dist, MAX_PULL_RADIUS);
  return {
    x: anchor.x + (dx / dist) * clamped,
    y: anchor.y + (dy / dist) * clamped,
  };
}

/**
 * Calculates launch velocity from the clamped pull position.
 */
export function computeLaunchVelocity(anchor: Vec2, pullPos: Vec2): Vec2 {
  const dx = anchor.x - pullPos.x;
  const dy = anchor.y - pullPos.y;
  return {
    x: dx * LAUNCH_POWER,
    y: dy * LAUNCH_POWER,
  };
}

/**
 * Predicts trajectory points for aiming arc display.
 */
export function computeTrajectoryPoints(anchor: Vec2, pullPos: Vec2, count = 22, stepDt = 0.045): Vec2[] {
  const vel = computeLaunchVelocity(anchor, pullPos);
  const pts: Vec2[] = [];
  for (let i = 1; i <= count; i++) {
    const t = i * stepDt;
    const x = anchor.x + vel.x * t;
    const y = anchor.y + vel.y * t + 0.5 * GRAVITY * t * t;
    if (y > GROUND_Y) break;
    pts.push({ x, y });
  }
  return pts;
}

/**
 * Launches the currently loaded bird on the slingshot.
 */
export function launchLoadedBird(world: SimulationWorld, pullPos: Vec2, events?: PhysicsEvents): boolean {
  const bird = world.activeBirds[0];
  if (!bird || bird.launched) return false;

  const vel = computeLaunchVelocity(world.slingshotPos, pullPos);
  const speed = Math.hypot(vel.x, vel.y);
  if (speed < 110) return false; // Pull too small, cancel launch

  bird.x = world.slingshotPos.x;
  bird.y = world.slingshotPos.y;
  bird.vx = vel.x;
  bird.vy = vel.y;
  bird.launched = true;
  bird.scaleX = 1.24;
  bird.scaleY = 0.78;
  world.cameraOverviewMode = false;

  // Wake blocks near trajectory or keep ready
  for (let i = 0; i < 6; i++) {
    const angle = Math.atan2(vel.y, vel.x) + (Math.random() - 0.5) * 0.6;
    spawnPooledParticle(world, {
      x: bird.x,
      y: bird.y,
      vx: -Math.cos(angle) * (60 + Math.random() * 90),
      vy: -Math.sin(angle) * (60 + Math.random() * 90),
      size: 5,
      color: BIRD_CATALOG[bird.type].accent,
      shape: 'feather',
      maxLife: 0.45,
    });
  }

  if (events) events.launched = bird.type;
  return true;
}

/**
 * Triggers a radial explosion (from Amber Bombardier or TNT barrel).
 */
export function triggerRadialExplosion(
  world: SimulationWorld,
  center: Vec2,
  radius: number,
  maxDamage: number,
  events?: PhysicsEvents
): void {
  world.hitstopTimer = Math.max(world.hitstopTimer, 0.065);
  world.cameraTrauma = Math.min(1, world.cameraTrauma + 0.75);
  if (events) events.explosion = center;

  // Expanding shockwave ring + 24 fiery embers
  spawnPooledParticle(world, {
    x: center.x,
    y: center.y,
    vx: 0,
    vy: 0,
    size: radius,
    color: '#fef08a',
    shape: 'ring',
    gravity: 0,
    maxLife: 0.32,
  });

  const colors = ['#f97316', '#ef4444', '#facc15', '#fef08a', '#57534e'];
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
    const speed = 120 + Math.random() * 340;
    spawnPooledParticle(world, {
      x: center.x,
      y: center.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      size: 5 + Math.random() * 6,
      color: colors[i % colors.length],
      shape: i % 3 === 0 ? 'shard' : 'circle',
      maxLife: 0.45 + Math.random() * 0.35,
    });
  }

  // Damage & impulse blocks
  for (const block of world.blocks) {
    if (block.destroyed) continue;
    const dx = block.x - center.x;
    const dy = block.y - center.y;
    const dist = Math.hypot(dx, dy);
    if (dist < radius && dist > 0.001) {
      const falloff = 1 - dist / radius;
      const dmg = maxDamage * falloff * (block.material === 'stone' ? 1.15 : 1.35);
      block.sleeping = false;
      block.vx += (dx / dist) * 460 * falloff;
      block.vy += ((dy / dist) * 460 - 180) * falloff;
      block.angularVelocity += ((Math.random() - 0.5) * 9) * falloff;
      applyBlockDamage(world, block, dmg, events);
    }
  }

  // Damage & impulse enemies
  for (const enemy of world.enemies) {
    if (enemy.destroyed || enemy.behaviorState === 'ko') continue;
    const dx = enemy.x - center.x;
    const dy = enemy.y - center.y;
    const dist = Math.hypot(dx, dy);
    if (dist < radius) {
      const falloff = 1 - dist / Math.max(radius, 1);
      const nx = dist > 0.01 ? dx / dist : 0;
      const ny = dist > 0.01 ? dy / dist : -1;
      enemy.vx += nx * 420 * falloff;
      enemy.vy += (ny * 420 - 160) * falloff;
      applyEnemyDamage(world, enemy, maxDamage * falloff * 1.25, true, events);
    }
  }
}

/**
 * Activates the special mid-air ability of the primary active bird.
 */
export function triggerBirdAbility(world: SimulationWorld, events?: PhysicsEvents): boolean {
  const bird = world.activeBirds.find((b) => b.launched && !b.abilityUsed && b.alive);
  if (!bird) return false;

  bird.abilityUsed = true;
  bird.hitFlash = 0.08;
  world.hitstopTimer = Math.max(world.hitstopTimer, 0.035);
  world.cameraTrauma = Math.min(1, world.cameraTrauma + 0.25);

  if (events) events.abilityTriggered = bird.type;

  if (bird.type === 'crimson') {
    // High-speed forward dash
    const angle = Math.atan2(bird.vy, bird.vx);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    bird.vx = cos * 880;
    bird.vy = sin * 420;
    bird.scaleX = 1.38;
    bird.scaleY = 0.72;
    addPopup(world, bird.x, bird.y - 28, 'AERO DASH!', '#fda4af');
  } else if (bird.type === 'azure') {
    // Split into 3 birds in a fan spread
    const speed = Math.max(480, Math.hypot(bird.vx, bird.vy) * 1.08);
    const baseAngle = Math.atan2(bird.vy, bird.vx);
    const spreads = [-0.23, 0.23];
    bird.vx = Math.cos(baseAngle) * speed;
    bird.vy = Math.sin(baseAngle) * speed;

    for (const deltaAngle of spreads) {
      const clone = spawnActiveBird('azure', bird.x, bird.y + deltaAngle * 35);
      clone.launched = true;
      clone.abilityUsed = true;
      clone.vx = Math.cos(baseAngle + deltaAngle) * speed;
      clone.vy = Math.sin(baseAngle + deltaAngle) * speed;
      clone.scaleX = 1.22;
      clone.scaleY = 0.82;
      world.activeBirds.push(clone);
    }
    addPopup(world, bird.x, bird.y - 28, 'TRI-SPLIT!', '#7dd3fc');
  } else if (bird.type === 'amber') {
    // Immediate concussive radial blast
    addPopup(world, bird.x, bird.y - 34, 'KABOOM!', '#fde68a');
    triggerRadialExplosion(world, { x: bird.x, y: bird.y }, 185, 195, events);
    bird.vx *= 0.25;
    bird.vy = -180;
  } else if (bird.type === 'gale') {
    // Meteoric vertical dive straight down onto fortress roofs
    bird.vx *= 0.18;
    bird.vy = 920;
    bird.scaleX = 0.74;
    bird.scaleY = 1.36;
    addPopup(world, bird.x, bird.y - 28, 'SKY DIVE!', '#fef08a');
  }

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    spawnPooledParticle(world, {
      x: bird.x,
      y: bird.y,
      vx: Math.cos(a) * 160,
      vy: Math.sin(a) * 160,
      size: 6,
      color: BIRD_CATALOG[bird.type].accent,
      shape: 'feather',
      maxLife: 0.4,
    });
  }

  return true;
}

export function applyBlockDamage(
  world: SimulationWorld,
  block: BlockEntity,
  damage: number,
  events?: PhysicsEvents
): void {
  if (block.destroyed || damage <= 3) return;
  block.hp -= damage;
  block.hitFlash = 0.055;
  block.sleeping = false;

  if (events) {
    events.materialHit = { material: block.material, intensity: Math.min(1, damage / 60) };
  }

  if (block.hp <= 0) {
    block.destroyed = true;
    const stats = getMaterialStats(block.material);
    world.score += stats.scoreValue;
    addPopup(world, block.x, block.y - 12, `+${stats.scoreValue}`, '#fde68a');

    if (events) events.blockDestroyed = block.material;

    const shardColor =
      block.material === 'ice'
        ? '#bae6fd'
        : block.material === 'wood'
        ? '#d97706'
        : block.material === 'stone'
        ? '#9ca3af'
        : '#ef4444';

    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 210;
      spawnPooledParticle(world, {
        x: block.x + (Math.random() - 0.5) * block.width * 0.6,
        y: block.y + (Math.random() - 0.5) * block.height * 0.6,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 60,
        size: 5 + Math.random() * 5,
        color: shardColor,
        shape: 'shard',
        vRot: (Math.random() - 0.5) * 12,
        maxLife: 0.55,
      });
    }

    if (block.material === 'tnt') {
      addPopup(world, block.x, block.y - 32, 'TNT BLAST!', '#f87171');
      triggerRadialExplosion(world, { x: block.x, y: block.y }, 190, 210, events);
    }
  }
}

export function applyEnemyDamage(
  world: SimulationWorld,
  enemy: EnemyEntity,
  rawDamage: number,
  bypassShield: boolean,
  events?: PhysicsEvents
): void {
  if (enemy.destroyed || enemy.behaviorState === 'ko' || rawDamage <= 4) return;

  const damage = enemy.shieldActive && !bypassShield ? rawDamage * 0.45 : rawDamage;
  enemy.hp -= damage;
  enemy.hitFlash = 0.06;

  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.behaviorState = 'ko';
    enemy.koTimer = 0.36; // 0.36s KO topple transition before removal
    enemy.vy = Math.min(enemy.vy, -170);
    enemy.vx += (Math.random() - 0.5) * 140;
    world.hitstopTimer = Math.max(world.hitstopTimer, 0.055);
    world.cameraTrauma = Math.min(1, world.cameraTrauma + 0.42);

    const stats = getEnemyStats(enemy.type);
    world.score += stats.scoreValue;
    addPopup(world, enemy.x, enemy.y - 24, `+${stats.scoreValue} KO!`, '#4ade80');

    if (events) events.enemyHit = { type: enemy.type, killed: true };
  } else {
    if (events) events.enemyHit = { type: enemy.type, killed: false };
  }
}

/**
 * Updates enemy distinct AI behavior policies & visible windup telegraphs.
 */
function updateEnemies(world: SimulationWorld, simDt: number, events?: PhysicsEvents): void {
  const flyingBird = world.activeBirds.find((b) => b.launched && b.alive);

  for (const enemy of world.enemies) {
    if (enemy.destroyed) continue;

    if (enemy.behaviorState === 'ko') {
      enemy.koTimer -= simDt;
      enemy.x += enemy.vx * simDt;
      enemy.y += enemy.vy * simDt;
      enemy.vy += GRAVITY * simDt;
      enemy.rotation += 7.5 * simDt;
      if (enemy.koTimer <= 0) {
        enemy.destroyed = true;
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          spawnPooledParticle(world, {
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(a) * (90 + Math.random() * 130),
            vy: Math.sin(a) * (90 + Math.random() * 130) - 40,
            size: 6,
            color: '#86efac',
            shape: 'circle',
            maxLife: 0.48,
          });
        }
      }
      continue;
    }

    // Distinct Policy 1: 'grunt' -> Sentry Hop & Incoming Duck Evasion
    if (enemy.type === 'grunt') {
      if (flyingBird && Math.hypot(flyingBird.x - enemy.x, flyingBird.y - enemy.y) < 230) {
        enemy.behaviorState = 'active'; // Duck posture lowers silhouette slightly
      } else {
        enemy.behaviorState = 'idle';
      }
    }

    // Distinct Policy 2: 'helmet' -> Shield Brace with 0.6s Windup Telegraph
    if (enemy.type === 'helmet') {
      enemy.behaviorTimer -= simDt;
      if (enemy.behaviorState === 'idle' && (flyingBird || enemy.behaviorTimer <= 0)) {
        enemy.behaviorState = 'windup';
        enemy.behaviorTimer = 0.6; // 0.6s visible telegraph before raising shield
        if (events) events.enemyWindup = 'helmet';
      } else if (enemy.behaviorState === 'windup' && enemy.behaviorTimer <= 0) {
        enemy.behaviorState = 'active';
        enemy.shieldActive = true;
        enemy.behaviorTimer = 2.8;
      } else if (enemy.behaviorState === 'active' && enemy.behaviorTimer <= 0) {
        enemy.behaviorState = 'idle';
        enemy.shieldActive = false;
        enemy.behaviorTimer = 2.2;
      }
    }

    // Distinct Policy 3: 'king' -> Royal Command Pulse with 0.75s Windup Telegraph
    if (enemy.type === 'king') {
      enemy.behaviorTimer -= simDt;
      if (enemy.behaviorState === 'idle' && enemy.behaviorTimer <= 0) {
        enemy.behaviorState = 'windup';
        enemy.behaviorTimer = 0.75; // 0.75s golden crown windup ring
        if (events) events.enemyWindup = 'king';
      } else if (enemy.behaviorState === 'windup' && enemy.behaviorTimer <= 0) {
        enemy.behaviorState = 'active';
        enemy.behaviorTimer = 1.2;
        // Fortifies nearby blocks slightly + shockwave visual ring
        spawnPooledParticle(world, {
          x: enemy.x,
          y: enemy.y,
          size: 110,
          color: '#facc15',
          shape: 'ring',
          gravity: 0,
          maxLife: 0.35,
        });
        for (const b of world.blocks) {
          if (!b.destroyed && Math.hypot(b.x - enemy.x, b.y - enemy.y) < 160) {
            b.hp = Math.min(b.maxHp, b.hp + 12);
          }
        }
      } else if (enemy.behaviorState === 'active' && enemy.behaviorTimer <= 0) {
        enemy.behaviorState = 'idle';
        enemy.behaviorTimer = 3.6;
      }
    }
  }
}

/**
 * Advances the simulation by rawDt seconds (clamped to <= 0.05s).
 */
export function stepSimulationWorld(world: SimulationWorld, rawDt: number, events?: PhysicsEvents): void {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  world.simTime += dt;

  // Decay camera shake trauma and hit flashes even during hitstop
  world.cameraTrauma = Math.max(0, world.cameraTrauma - dt * 1.85);
  for (const b of world.activeBirds) {
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    b.scaleX += (1 - b.scaleX) * Math.min(1, dt * 14);
    b.scaleY += (1 - b.scaleY) * Math.min(1, dt * 14);
  }
  for (const blk of world.blocks) {
    blk.hitFlash = Math.max(0, blk.hitFlash - dt);
  }
  for (const en of world.enemies) {
    en.hitFlash = Math.max(0, en.hitFlash - dt);
  }

  // Update pooled particles & floating popups in real dt
  for (const p of world.particles) {
    if (!p.active) continue;
    p.life += dt;
    if (p.life >= p.maxLife) {
      p.active = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    p.rotation += p.vRot * dt;
    p.alpha = 1 - p.life / p.maxLife;
  }

  for (let i = world.popups.length - 1; i >= 0; i--) {
    const pop = world.popups[i];
    pop.life += dt;
    pop.y -= 36 * dt;
    if (pop.life >= pop.maxLife) {
      world.popups.splice(i, 1);
    }
  }

  // Sim-level hitstop freeze for heavy impacts
  if (world.hitstopTimer > 0) {
    world.hitstopTimer = Math.max(0, world.hitstopTimer - dt);
    return;
  }

  const simDt = dt;
  updateEnemies(world, simDt, events);

  // Step active birds
  for (const bird of world.activeBirds) {
    if (!bird.launched || !bird.alive) continue;

    bird.vy += GRAVITY * simDt;
    bird.x += bird.vx * simDt;
    bird.y += bird.vy * simDt;
    bird.rotation += bird.angularVelocity * simDt;

    if (Math.hypot(bird.vx, bird.vy) > 120) {
      if (
        bird.trail.length === 0 ||
        Math.hypot(bird.x - bird.trail[bird.trail.length - 1].x, bird.y - bird.trail[bird.trail.length - 1].y) > 18
      ) {
        bird.trail.push({ x: bird.x, y: bird.y });
        if (bird.trail.length > 26) bird.trail.shift();
      }
    }

    // Ground collision
    if (bird.y + bird.radius > world.groundY) {
      bird.y = world.groundY - bird.radius;
      if (Math.abs(bird.vy) > 90) {
        bird.vy = -bird.vy * 0.42;
        bird.vx *= 0.72;
        bird.angularVelocity = bird.vx * 0.04;
        bird.scaleX = 1.22;
        bird.scaleY = 0.78;
      } else {
        bird.vy = 0;
        bird.vx *= 0.85;
        bird.angularVelocity = bird.vx * 0.03;
      }
    }

    const speed = Math.hypot(bird.vx, bird.vy);
    if (speed < 28 || bird.x > 1650 || bird.x < -200) {
      bird.restTimer += simDt;
      if (bird.restTimer > 1.1 || bird.x > 1650 || bird.x < -200) {
        bird.alive = false;
      }
    }
  }

  // Step blocks & enemies only when awake or unsupported
  for (const block of world.blocks) {
    if (block.destroyed) continue;

    // Check if block has support underneath when sleeping
    if (block.sleeping) {
      const bottomY = block.y + block.height / 2;
      const onGround = Math.abs(bottomY - world.groundY) < 4;
      let supported = onGround;
      if (!supported) {
        for (const other of world.blocks) {
          if (other === block || other.destroyed) continue;
          const horizOverlap = Math.abs(block.x - other.x) < (block.width + other.width) * 0.48;
          const vertTouch = Math.abs(bottomY - (other.y - other.height / 2)) < 6;
          if (horizOverlap && vertTouch) {
            supported = true;
            break;
          }
        }
      }
      if (!supported) {
        block.sleeping = false;
      }
    }

    if (!block.sleeping) {
      block.vy += GRAVITY * simDt;
      block.x += block.vx * simDt;
      block.y += block.vy * simDt;
      block.rotation += block.angularVelocity * simDt;
      block.vx *= Math.pow(0.985, simDt * 60);
      block.angularVelocity *= Math.pow(0.92, simDt * 60);

      // Ground collision for block
      const halfH = block.height / 2;
      if (block.y + halfH > world.groundY) {
        const impactVy = block.vy;
        block.y = world.groundY - halfH;
        block.vy = -block.vy * 0.18;
        block.vx *= 0.74;
        block.rotation *= 0.65;
        if (impactVy > 260) {
          applyBlockDamage(world, block, (impactVy - 220) * 0.22, events);
        }
        if (Math.hypot(block.vx, block.vy) < 12 && Math.abs(block.angularVelocity) < 0.2) {
          block.vx = 0;
          block.vy = 0;
          block.angularVelocity = 0;
          block.rotation = 0;
          block.sleeping = true;
        }
      }
    }
  }

  // Step live enemies support & physics
  for (const enemy of world.enemies) {
    if (enemy.destroyed || enemy.behaviorState === 'ko') continue;

    enemy.vy += GRAVITY * simDt;
    enemy.x += enemy.vx * simDt;
    enemy.y += enemy.vy * simDt;
    enemy.vx *= Math.pow(0.9, simDt * 60);

    // Check ground collision
    if (enemy.y + enemy.radius > world.groundY) {
      const impactVy = enemy.vy;
      enemy.y = world.groundY - enemy.radius;
      enemy.vy = 0;
      enemy.vx *= 0.7;
      if (impactVy > 230) {
        applyEnemyDamage(world, enemy, (impactVy - 190) * 0.34, true, events);
      }
    }

    // Check block platform support for enemies
    for (const block of world.blocks) {
      if (block.destroyed) continue;
      const halfW = block.width / 2;
      const halfH = block.height / 2;
      if (Math.abs(enemy.x - block.x) < halfW + enemy.radius * 0.75) {
        const topY = block.y - halfH;
        if (enemy.y + enemy.radius >= topY && enemy.y + enemy.radius <= topY + 22 && enemy.vy >= 0) {
          const relVy = enemy.vy - block.vy;
          enemy.y = topY - enemy.radius;
          enemy.vy = block.vy;
          enemy.vx += (block.vx - enemy.vx) * 0.3;
          if (relVy > 220) {
            applyEnemyDamage(world, enemy, (relVy - 180) * 0.32, true, events);
          }
        }
      }
    }
  }

  // Bird vs Block collisions
  for (const bird of world.activeBirds) {
    if (!bird.launched || !bird.alive) continue;
    for (const block of world.blocks) {
      if (block.destroyed) continue;
      const halfW = block.width / 2;
      const halfH = block.height / 2;
      const closestX = Math.max(block.x - halfW, Math.min(bird.x, block.x + halfW));
      const closestY = Math.max(block.y - halfH, Math.min(bird.y, block.y + halfH));
      const dx = bird.x - closestX;
      const dy = bird.y - closestY;
      const dist = Math.hypot(dx, dy);

      if (dist < bird.radius) {
        const nx = dist > 0.001 ? dx / dist : -1;
        const ny = dist > 0.001 ? dy / dist : 0;
        const overlap = bird.radius - dist;
        bird.x += nx * overlap;
        bird.y += ny * overlap;

        const relVx = bird.vx - block.vx;
        const relVy = bird.vy - block.vy;
        const impactSpeed = Math.hypot(relVx, relVy);

        // Material vulnerability multipliers
        let mult = 1.0;
        if (bird.type === 'azure' && block.material === 'ice') mult = 2.25;
        if (bird.type === 'amber' && block.material === 'stone') mult = 1.65;
        if (bird.type === 'gale' && bird.abilityUsed) mult = 1.85;
        if (bird.type === 'crimson' && bird.abilityUsed) mult = 1.45;

        const damage = impactSpeed * 0.19 * bird.mass * mult;
        applyBlockDamage(world, block, damage, events);

        // Transfer momentum to block and wake neighbors
        block.sleeping = false;
        block.vx += relVx * 0.42;
        block.vy += relVy * 0.38 - 35;
        block.angularVelocity += ((bird.y - block.y) / halfH) * (relVx * 0.012);

        if (block.destroyed && impactSpeed > 320) {
          // Carry through broken block with partial velocity retention
          bird.vx *= 0.68;
          bird.vy *= 0.68;
        } else {
          bird.vx = (bird.vx - 1.45 * (bird.vx * nx + bird.vy * ny) * nx) * 0.58;
          bird.vy = (bird.vy - 1.45 * (bird.vx * nx + bird.vy * ny) * ny) * 0.58;
        }

        bird.hitFlash = 0.06;
        bird.scaleX = 0.8;
        bird.scaleY = 1.22;
        if (impactSpeed > 260) {
          world.hitstopTimer = Math.max(world.hitstopTimer, 0.035);
          world.cameraTrauma = Math.min(1, world.cameraTrauma + 0.28);
        }
      }
    }
  }

  // Bird vs Enemy collisions
  for (const bird of world.activeBirds) {
    if (!bird.launched || !bird.alive) continue;
    for (const enemy of world.enemies) {
      if (enemy.destroyed || enemy.behaviorState === 'ko') continue;
      const dx = enemy.x - bird.x;
      const dy = enemy.y - bird.y;
      const dist = Math.hypot(dx, dy);
      const minDist = bird.radius + enemy.radius;
      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        enemy.x += nx * overlap * 0.6;
        bird.x -= nx * overlap * 0.4;

        const impactSpeed = Math.hypot(bird.vx - enemy.vx, bird.vy - enemy.vy);
        const fromAbove = bird.y < enemy.y - enemy.radius * 0.35;
        const dmg = impactSpeed * 0.28 * bird.mass;
        applyEnemyDamage(world, enemy, dmg, fromAbove, events);

        enemy.vx += bird.vx * 0.48;
        enemy.vy += bird.vy * 0.48 - 60;
        bird.vx *= -0.45;
        bird.vy = -190;
        bird.hitFlash = 0.06;
      }
    }
  }

  // Block vs Block stacking & collision resolution (2 iterations)
  for (let iter = 0; iter < 2; iter++) {
    for (let i = 0; i < world.blocks.length; i++) {
      const a = world.blocks[i];
      if (a.destroyed) continue;
      for (let j = i + 1; j < world.blocks.length; j++) {
        const b = world.blocks[j];
        if (b.destroyed) continue;
        if (a.sleeping && b.sleeping) continue;

        const overlapX = (a.width + b.width) / 2 - Math.abs(a.x - b.x);
        const overlapY = (a.height + b.height) / 2 - Math.abs(a.y - b.y);

        if (overlapX > 0 && overlapY > 0) {
          const relSpeed = Math.hypot(a.vx - b.vx, a.vy - b.vy);
          if (overlapX < overlapY) {
            const sign = a.x < b.x ? -1 : 1;
            a.x += sign * overlapX * 0.5;
            b.x -= sign * overlapX * 0.5;
            const avgVx = (a.vx + b.vx) * 0.45;
            a.vx = avgVx;
            b.vx = avgVx;
          } else {
            // Vertical stacking resolution
            if (a.y < b.y) {
              a.y -= overlapY;
              a.vy = Math.min(a.vy, b.vy * 0.5);
              a.vx *= 0.85;
            } else {
              b.y -= overlapY;
              b.vy = Math.min(b.vy, a.vy * 0.5);
              b.vx *= 0.85;
            }
          }

          if (relSpeed > 180) {
            a.sleeping = false;
            b.sleeping = false;
            const crushDmg = (relSpeed - 150) * 0.16;
            applyBlockDamage(world, a, crushDmg, events);
            applyBlockDamage(world, b, crushDmg, events);
          }
        }
      }
    }
  }

  // Falling Block vs Enemy crushing damage
  for (const block of world.blocks) {
    if (block.destroyed || block.sleeping) continue;
    const blockSpeed = Math.hypot(block.vx, block.vy);
    if (blockSpeed < 65) continue;

    for (const enemy of world.enemies) {
      if (enemy.destroyed || enemy.behaviorState === 'ko') continue;
      const halfW = block.width / 2;
      const halfH = block.height / 2;
      const closestX = Math.max(block.x - halfW, Math.min(enemy.x, block.x + halfW));
      const closestY = Math.max(block.y - halfH, Math.min(enemy.y, block.y + halfH));
      const dist = Math.hypot(enemy.x - closestX, enemy.y - closestY);
      if (dist < enemy.radius) {
        const crushDmg = blockSpeed * 0.25 * Math.max(1, block.mass);
        applyEnemyDamage(world, enemy, crushDmg, true, events);
        block.vy *= 0.5;
        block.vx *= 0.6;
      }
    }
  }

  // Camera tracking logic
  const leadBird = world.activeBirds.find((b) => b.launched && b.alive);
  if (world.cameraOverviewMode) {
    world.cameraTargetX = 180;
  } else if (leadBird && leadBird.x > 650) {
    world.cameraTargetX = Math.max(0, Math.min(180, (leadBird.x - 650) * 0.35));
  } else {
    world.cameraTargetX = 0;
  }
  world.cameraX += (world.cameraTargetX - world.cameraX) * Math.min(1, simDt * 5.5);

  // Check Bird Queue reload and Outcome resolution
  const anyFlyingBird = world.activeBirds.some((b) => b.launched && b.alive);
  const unlaunchedBird = world.activeBirds.find((b) => !b.launched && b.alive);
  const remainingEnemies = world.enemies.filter((e) => !e.destroyed).length;

  if (remainingEnemies === 0 && world.outcomePending === 'none') {
    world.outcomePending = 'victory';
    world.outcomeDelayTimer = 0.65;
    // Bonus 1000 points per unused bird in queue + unlaunched bird
    const unusedCount = world.birdQueue.length + (unlaunchedBird ? 1 : 0);
    if (unusedCount > 0) {
      const bonus = unusedCount * 1000;
      world.score += bonus;
      addPopup(world, world.slingshotPos.x + 60, world.slingshotPos.y - 60, `+${bonus} UNUSED BIRDS!`, '#38bdf8');
    }
  } else if (!unlaunchedBird && !anyFlyingBird && world.outcomePending === 'none') {
    if (world.birdQueue.length > 0) {
      world.nextBirdTimer += simDt;
      if (world.nextBirdTimer >= 0.45) {
        world.nextBirdTimer = 0;
        const nextType = world.birdQueue.shift()!;
        world.activeBirds = [spawnActiveBird(nextType, world.slingshotPos.x, world.slingshotPos.y)];
      }
    } else {
      // Wait briefly for falling blocks to finish crushing any remaining enemies
      world.settleTimer += simDt;
      if (world.settleTimer >= 1.25) {
        if (world.enemies.every((e) => e.destroyed)) {
          world.outcomePending = 'victory';
          world.outcomeDelayTimer = 0.4;
        } else {
          world.outcomePending = 'defeat';
          world.outcomeDelayTimer = 0.5;
        }
      }
    }
  }

  if (world.outcomePending !== 'none') {
    world.outcomeDelayTimer -= simDt;
    if (world.outcomeDelayTimer <= 0 && events) {
      events.outcome = world.outcomePending;
    }
  }
}

export function calculateStarRating(levelId: number, score: number): number {
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
  const [one, two, three] = level.starThresholds;
  if (score >= three) return 3;
  if (score >= two) return 2;
  if (score >= one) return 1;
  return 1;
}
