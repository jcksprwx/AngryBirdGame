import { BirdType, EnemyType, MaterialType } from './types';

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private jitter(baseFreq: number): number {
    return baseFreq * (0.93 + Math.random() * 0.14);
  }

  public playStretchCreak(tensionRatio: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(this.jitter(120 + tensionRatio * 140), now);
    osc.frequency.exponentialRampToValueAtTime(160 + tensionRatio * 180, now + 0.045);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playLaunch(birdType: BirdType): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const base =
      birdType === 'crimson' ? 280 : birdType === 'azure' ? 370 : birdType === 'amber' ? 190 : 330;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(this.jitter(base), now);
    osc.frequency.exponentialRampToValueAtTime(base * 2.1, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(base * 0.85, now + 0.28);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.29);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playAbility(birdType: BirdType): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = birdType === 'amber' ? 'sawtooth' : 'triangle';
    const startFreq = birdType === 'azure' ? 520 : birdType === 'gale' ? 680 : 420;
    const endFreq = birdType === 'gale' ? 220 : 880;

    osc.frequency.setValueAtTime(this.jitter(startFreq), now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playMaterialHit(material: MaterialType, intensity: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (material === 'ice') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(this.jitter(880), now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.09);
    } else if (material === 'wood') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(this.jitter(210), now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.1);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(this.jitter(135), now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.12);
    }

    const vol = Math.min(0.16, Math.max(0.03, intensity * 0.14));
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playExplosion(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.38);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playEnemyHit(type: EnemyType, killed: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    const base = type === 'king' ? 160 : type === 'helmet' ? 230 : 310;
    osc.frequency.setValueAtTime(this.jitter(base), now);
    osc.frequency.exponentialRampToValueAtTime(killed ? base * 1.65 : base * 0.75, now + 0.16);

    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playEnemyWindup(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.22);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playOutcome(outcome: 'victory' | 'defeat'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = outcome === 'victory' ? [392, 493.88, 587.33, 783.99] : [349.23, 311.13, 261.63, 196];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.14, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.3);
    });
  }
}

export const gameAudio = new GameAudioEngine();
