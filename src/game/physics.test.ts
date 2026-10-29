import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStarRating,
  clampSlingshotPull,
  computeLaunchVelocity,
  computeTrajectoryPoints,
  createSimulationWorld,
  launchLoadedBird,
  stepSimulationWorld,
  triggerBirdAbility,
  triggerRadialExplosion,
} from './physics';
import { MAX_PULL_RADIUS, SLINGSHOT_X, SLINGSHOT_Y } from './levels';

test('slingshot pull clamps within MAX_PULL_RADIUS and computes opposite launch velocity', () => {
  const anchor = { x: SLINGSHOT_X, y: SLINGSHOT_Y };
  const farPoint = { x: SLINGSHOT_X - 300, y: SLINGSHOT_Y + 400 };
  const clamped = clampSlingshotPull(anchor, farPoint);
  const dist = Math.hypot(clamped.x - anchor.x, clamped.y - anchor.y);

  assert.ok(Math.abs(dist - MAX_PULL_RADIUS) < 0.01);

  const vel = computeLaunchVelocity(anchor, clamped);
  assert.ok(vel.x > 0, 'pulling left launches bird to the right');
  assert.ok(vel.y < 0, 'pulling down launches bird upward');

  const traj = computeTrajectoryPoints(anchor, clamped, 15, 0.04);
  assert.ok(traj.length >= 10);
  assert.ok(traj[0].x > anchor.x);
});

test('all 5 levels survive initial 3 seconds without input without collapsing', () => {
  for (let levelId = 1; levelId <= 5; levelId++) {
    const world = createSimulationWorld(levelId);
    const initialBlocks = world.blocks.length;
    const initialEnemies = world.enemies.length;

    for (let i = 0; i < 180; i++) {
      stepSimulationWorld(world, 1 / 60);
    }

    assert.equal(world.blocks.filter((b) => !b.destroyed).length, initialBlocks, `Level ${levelId} blocks stay intact`);
    assert.equal(world.enemies.filter((e) => !e.destroyed).length, initialEnemies, `Level ${levelId} enemies stay intact`);
    assert.equal(world.score, 0, `Level ${levelId} score remains 0 before player action`);
  }
});

test('bird launch and mid-air abilities work for crimson, azure, amber, and gale', () => {
  // Test Azure Splitter (level 2 starts with azure)
  const world2 = createSimulationWorld(2);
  const launched = launchLoadedBird(world2, { x: SLINGSHOT_X - 95, y: SLINGSHOT_Y + 45 });
  assert.equal(launched, true);
  assert.equal(world2.activeBirds.length, 1);

  stepSimulationWorld(world2, 0.03);
  const splitUsed = triggerBirdAbility(world2);
  assert.equal(splitUsed, true);
  assert.equal(world2.activeBirds.length, 3, 'Azure Splitter spawns 2 additional birds for a 3-bird volley');

  // Test Gale Falcon (level 3 starts with gale)
  const world3 = createSimulationWorld(3);
  launchLoadedBird(world3, { x: SLINGSHOT_X - 90, y: SLINGSHOT_Y + 50 });
  stepSimulationWorld(world3, 0.03);
  triggerBirdAbility(world3);
  assert.equal(world3.activeBirds[0].vy, 920, 'Gale Falcon enters high-speed vertical dive');
});

test('radial explosion damages blocks, detonates TNT, and awards score on enemy elimination', () => {
  const world = createSimulationWorld(1);
  const targetEnemy = world.enemies[0];
  triggerRadialExplosion(world, { x: targetEnemy.x, y: targetEnemy.y }, 200, 220);

  assert.equal(targetEnemy.behaviorState, 'ko');
  assert.ok(world.score >= 1000, 'Defeating enemy grants at least 1000 points');
  assert.ok(world.hitstopTimer > 0, 'Heavy explosion triggers sim-level hitstop');

  // Step through hitstop + KO timer + victory delay
  let finalOutcome: 'victory' | 'defeat' | undefined;
  for (const e of world.enemies) {
    triggerRadialExplosion(world, { x: e.x, y: e.y }, 190, 240);
  }
  for (let i = 0; i < 120; i++) {
    const events: { outcome?: 'victory' | 'defeat' } = {};
    stepSimulationWorld(world, 1 / 60, events);
    if (events.outcome) finalOutcome = events.outcome;
  }
  assert.equal(finalOutcome, 'victory');
  assert.ok(calculateStarRating(1, world.score) >= 2);
});

import { buildQuickWindowsLauncherScript, getDesktopExportSpec } from './exporter';

test('desktop exporter provides valid Windows .exe spec and batch launcher script', () => {
  const spec = getDesktopExportSpec();
  assert.equal(spec.executableName, 'FeatherAndFury-Portable.exe');
  assert.ok(spec.electronBuildCommand.includes('dist:win'));

  const script = buildQuickWindowsLauncherScript('file:///C:/Games/FeatherAndFury.html');
  assert.ok(script.includes('msedge --app='));
  assert.ok(script.includes('--window-size=1440,900'));
});

