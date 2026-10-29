export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type BirdType = 'crimson' | 'azure' | 'amber' | 'gale';

export type MaterialType = 'wood' | 'ice' | 'stone' | 'tnt';

export type EnemyType = 'grunt' | 'helmet' | 'king';

export interface Vec2 {
  x: number;
  y: number;
}

export interface BirdMetadata {
  type: BirdType;
  name: string;
  role: string;
  abilityName: string;
  color: string;
  accent: string;
  radius: number;
  mass: number;
}

export interface ActiveBird {
  id: number;
  type: BirdType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  rotation: number;
  angularVelocity: number;
  launched: boolean;
  abilityUsed: boolean;
  hitFlash: number;
  scaleX: number;
  scaleY: number;
  restTimer: number;
  alive: boolean;
  trail: Vec2[];
}

export interface BlockEntity {
  id: number;
  material: MaterialType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  hp: number;
  maxHp: number;
  mass: number;
  hitFlash: number;
  sleeping: boolean;
  destroyed: boolean;
}

export interface EnemyEntity {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  /** Distinct AI behavior state */
  behaviorState: 'idle' | 'windup' | 'active' | 'ko';
  behaviorTimer: number;
  shieldActive: boolean;
  koTimer: number;
  destroyed: boolean;
}

export interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  shape: 'circle' | 'shard' | 'feather' | 'ring';
  rotation: number;
  vRot: number;
}

export interface FloatingPopup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface LevelBlockDef {
  material: MaterialType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelEnemyDef {
  type: EnemyType;
  x: number;
  y: number;
  radius?: number;
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  birds: BirdType[];
  blocks: LevelBlockDef[];
  enemies: LevelEnemyDef[];
  starThresholds: [number, number, number];
}

export interface RunSnapshot {
  outcome: 'victory' | 'defeat';
  levelId: number;
  levelName: string;
  score: number;
  bestScore: number;
  stars: number;
  birdsRemaining: number;
  enemiesCleared: number;
  totalEnemies: number;
  destructionPercent: number;
}

export interface SimulationWorld {
  levelId: number;
  groundY: number;
  slingshotPos: Vec2;
  birdQueue: BirdType[];
  activeBirds: ActiveBird[];
  blocks: BlockEntity[];
  enemies: EnemyEntity[];
  particles: PooledParticle[];
  particleCursor: number;
  popups: FloatingPopup[];
  score: number;
  initialTotalEnemyHp: number;
  initialBlockCount: number;
  hitstopTimer: number;
  cameraTrauma: number;
  cameraX: number;
  cameraTargetX: number;
  cameraOverviewMode: boolean;
  settleTimer: number;
  nextBirdTimer: number;
  outcomePending: 'none' | 'victory' | 'defeat';
  outcomeDelayTimer: number;
  simTime: number;
}
