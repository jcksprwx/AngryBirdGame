import { BirdMetadata, BirdType, LevelDef } from './types';

export const GROUND_Y = 620;
export const SLINGSHOT_X = 275;
export const SLINGSHOT_Y = GROUND_Y - 115; // 505
export const MAX_PULL_RADIUS = 115;
export const LAUNCH_POWER = 9.2;

export const BIRD_CATALOG: Record<BirdType, BirdMetadata> = {
  crimson: {
    type: 'crimson',
    name: 'Crimson Striker',
    role: 'Supersonic Dash · Balanced Impact',
    abilityName: 'Aero Dash [Space]',
    color: '#e11d48',
    accent: '#fda4af',
    radius: 21,
    mass: 1.2,
  },
  azure: {
    type: 'azure',
    name: 'Azure Splitter',
    role: 'Tri-Split Volley · 2.2x Ice Shatter',
    abilityName: 'Triple Split [Space]',
    color: '#0284c7',
    accent: '#7dd3fc',
    radius: 17,
    mass: 0.95,
  },
  amber: {
    type: 'amber',
    name: 'Amber Bombardier',
    role: 'Radial Blast · Heavy Stone Breaker',
    abilityName: 'Shockwave Detonate [Space]',
    color: '#d97706',
    accent: '#fde68a',
    radius: 25,
    mass: 1.65,
  },
  gale: {
    type: 'gale',
    name: 'Gale Falcon',
    role: 'Meteoric Vertical Dive · Roof Crusher',
    abilityName: 'Sky Dive [Space]',
    color: '#eab308',
    accent: '#fef08a',
    radius: 20,
    mass: 1.35,
  },
};

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'Timber Watchtower',
    subtitle: 'Shatter the outer wooden palisade and dislodge the lookout boars.',
    birds: ['crimson', 'azure', 'amber'],
    starThresholds: [2500, 4200, 5800],
    blocks: [
      // Left guard pillar + TNT barrel
      { material: 'wood', x: 760, y: GROUND_Y - 45, width: 26, height: 90 },
      { material: 'tnt', x: 760, y: GROUND_Y - 112, width: 44, height: 44 },
      // Main two-story watchtower
      { material: 'wood', x: 880, y: GROUND_Y - 55, width: 28, height: 110 },
      { material: 'wood', x: 1010, y: GROUND_Y - 55, width: 28, height: 110 },
      { material: 'wood', x: 945, y: GROUND_Y - 122, width: 168, height: 24 },
      // Second floor
      { material: 'ice', x: 900, y: GROUND_Y - 174, width: 24, height: 80 },
      { material: 'ice', x: 990, y: GROUND_Y - 174, width: 24, height: 80 },
      { material: 'wood', x: 945, y: GROUND_Y - 226, width: 140, height: 24 },
    ],
    enemies: [
      { type: 'grunt', x: 945, y: GROUND_Y - 24, radius: 24 },
      { type: 'grunt', x: 945, y: GROUND_Y - 158, radius: 22 },
    ],
  },
  {
    id: 2,
    name: 'Frostbridge Bastion',
    subtitle: 'Use Azure Splitters to cleave the glacial arches protecting the Ironhelm.',
    birds: ['azure', 'azure', 'crimson', 'amber'],
    starThresholds: [3600, 5600, 7400],
    blocks: [
      // Front ice bunker
      { material: 'ice', x: 750, y: GROUND_Y - 50, width: 26, height: 100 },
      { material: 'ice', x: 850, y: GROUND_Y - 50, width: 26, height: 100 },
      { material: 'ice', x: 800, y: GROUND_Y - 112, width: 136, height: 24 },
      // Rear timber & stone bastion
      { material: 'stone', x: 950, y: GROUND_Y - 60, width: 30, height: 120 },
      { material: 'stone', x: 1090, y: GROUND_Y - 60, width: 30, height: 120 },
      { material: 'wood', x: 1020, y: GROUND_Y - 132, width: 176, height: 24 },
      { material: 'ice', x: 980, y: GROUND_Y - 184, width: 24, height: 80 },
      { material: 'ice', x: 1060, y: GROUND_Y - 184, width: 24, height: 80 },
      { material: 'wood', x: 1020, y: GROUND_Y - 236, width: 130, height: 24 },
    ],
    enemies: [
      { type: 'grunt', x: 800, y: GROUND_Y - 23, radius: 23 },
      { type: 'helmet', x: 1020, y: GROUND_Y - 26, radius: 26 },
      { type: 'grunt', x: 1020, y: GROUND_Y - 166, radius: 22 },
    ],
  },
  {
    id: 3,
    name: 'Powderkeg Citadel',
    subtitle: 'Drop Gale Falcon from high altitude or detonate the central TNT magazine.',
    birds: ['gale', 'crimson', 'amber', 'azure'],
    starThresholds: [4500, 6800, 8800],
    blocks: [
      // Outer stone shield wall
      { material: 'stone', x: 730, y: GROUND_Y - 65, width: 34, height: 130 },
      // Central powder magazine
      { material: 'wood', x: 840, y: GROUND_Y - 50, width: 26, height: 100 },
      { material: 'tnt', x: 905, y: GROUND_Y - 24, width: 48, height: 48 },
      { material: 'wood', x: 970, y: GROUND_Y - 50, width: 26, height: 100 },
      { material: 'wood', x: 905, y: GROUND_Y - 112, width: 166, height: 24 },
      // Upper sniper roost
      { material: 'wood', x: 865, y: GROUND_Y - 164, width: 24, height: 80 },
      { material: 'wood', x: 945, y: GROUND_Y - 164, width: 24, height: 80 },
      { material: 'ice', x: 905, y: GROUND_Y - 216, width: 120, height: 24 },
      // Rear guard tower
      { material: 'stone', x: 1070, y: GROUND_Y - 55, width: 28, height: 110 },
      { material: 'stone', x: 1170, y: GROUND_Y - 55, width: 28, height: 110 },
      { material: 'wood', x: 1120, y: GROUND_Y - 122, width: 136, height: 24 },
    ],
    enemies: [
      { type: 'grunt', x: 905, y: GROUND_Y - 146, radius: 22 },
      { type: 'helmet', x: 1120, y: GROUND_Y - 26, radius: 26 },
      { type: 'grunt', x: 1120, y: GROUND_Y - 156, radius: 22 },
    ],
  },
  {
    id: 4,
    name: 'Ironclad Keep',
    subtitle: 'Breach the reinforced granite vaults with Bombardier and Falcon strikes.',
    birds: ['amber', 'gale', 'azure', 'crimson'],
    starThresholds: [5200, 7800, 10200],
    blocks: [
      // Left granite bunker
      { material: 'stone', x: 760, y: GROUND_Y - 55, width: 30, height: 110 },
      { material: 'stone', x: 880, y: GROUND_Y - 55, width: 30, height: 110 },
      { material: 'stone', x: 820, y: GROUND_Y - 122, width: 158, height: 24 },
      { material: 'tnt', x: 820, y: GROUND_Y - 156, width: 44, height: 44 },
      // Right twin-tier fortress
      { material: 'stone', x: 970, y: GROUND_Y - 60, width: 30, height: 120 },
      { material: 'stone', x: 1130, y: GROUND_Y - 60, width: 30, height: 120 },
      { material: 'wood', x: 1050, y: GROUND_Y - 132, width: 196, height: 24 },
      { material: 'ice', x: 995, y: GROUND_Y - 186, width: 26, height: 84 },
      { material: 'ice', x: 1105, y: GROUND_Y - 186, width: 26, height: 84 },
      { material: 'stone', x: 1050, y: GROUND_Y - 240, width: 148, height: 24 },
    ],
    enemies: [
      { type: 'helmet', x: 820, y: GROUND_Y - 26, radius: 25 },
      { type: 'helmet', x: 1050, y: GROUND_Y - 26, radius: 26 },
      { type: 'grunt', x: 1050, y: GROUND_Y - 166, radius: 22 },
      { type: 'grunt', x: 1050, y: GROUND_Y - 274, radius: 21 },
    ],
  },
  {
    id: 5,
    name: "Warlord Tusk's Throne",
    subtitle: 'Topple the Obsidian Sanctum and dethrone Warlord Tusk before birds run out.',
    birds: ['azure', 'amber', 'gale', 'crimson', 'amber'],
    starThresholds: [6500, 9500, 12800],
    blocks: [
      // Outer ice & TNT gatehouse
      { material: 'ice', x: 730, y: GROUND_Y - 50, width: 26, height: 100 },
      { material: 'ice', x: 830, y: GROUND_Y - 50, width: 26, height: 100 },
      { material: 'wood', x: 780, y: GROUND_Y - 112, width: 136, height: 24 },
      { material: 'tnt', x: 780, y: GROUND_Y - 146, width: 44, height: 44 },
      // Grand Throne Room
      { material: 'stone', x: 920, y: GROUND_Y - 65, width: 32, height: 130 },
      { material: 'stone', x: 1120, y: GROUND_Y - 65, width: 32, height: 130 },
      { material: 'stone', x: 1020, y: GROUND_Y - 142, width: 238, height: 26 },
      // Second tier sanctum
      { material: 'wood', x: 950, y: GROUND_Y - 198, width: 26, height: 86 },
      { material: 'tnt', x: 1020, y: GROUND_Y - 178, width: 44, height: 44 },
      { material: 'wood', x: 1090, y: GROUND_Y - 198, width: 26, height: 86 },
      { material: 'stone', x: 1020, y: GROUND_Y - 253, width: 176, height: 24 },
    ],
    enemies: [
      { type: 'grunt', x: 780, y: GROUND_Y - 23, radius: 22 },
      { type: 'helmet', x: 975, y: GROUND_Y - 26, radius: 25 },
      { type: 'helmet', x: 1065, y: GROUND_Y - 26, radius: 25 },
      { type: 'king', x: 1020, y: GROUND_Y - 299, radius: 34 },
    ],
  },
];
