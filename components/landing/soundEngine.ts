/**
 * soundEngine — fully synthesized ambient audio for the landing page, no
 * files. Off until the user opts in (autoplay policy needs the gesture).
 *
 * Layers:
 *  - Pad: two detuned sines through a slowly-breathing low-pass — the warm
 *    "vault" bed.
 *  - Shimmer: high-passed noise whose level follows the particle-assembly
 *    scroll progress, settling low once the card is built.
 *  - Sparkle pings: sparse little sine chimes while sound is on.
 */

class GoldSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private shimmerGain: GainNode | null = null;
  private pingTimer: number | null = null;
  private enabled = false;
  private lastProgress = 0;

  get isOn() {
    return this.enabled;
  }

  private build() {
    if (this.ctx) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    /* Pad — warm detuned bed */
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 420;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.05;
    padFilter.connect(padGain).connect(master);

    [110, 164.8, 220.6].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.detune.value = i * 4 - 4;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.35 : 1;
      osc.connect(g).connect(padFilter);
      osc.start();
    });

    // The filter breathes
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain).connect(padFilter.frequency);
    lfo.start();

    /* Shimmer — assembly dust */
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5200;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0;
    noise.connect(hp).connect(shimmerGain).connect(master);
    noise.start();
    this.shimmerGain = shimmerGain;
  }

  enable() {
    this.build();
    const ctx = this.ctx!;
    if (ctx.state === 'suspended') void ctx.resume();
    this.enabled = true;
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
    this.applyProgress(this.lastProgress);
    this.schedulePing();
  }

  disable() {
    this.enabled = false;
    if (this.pingTimer) window.clearTimeout(this.pingTimer);
    this.pingTimer = null;
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    window.setTimeout(() => {
      if (!this.enabled && this.ctx?.state === 'running') void this.ctx.suspend();
    }, 700);
  }

  /** Fed by ScrubHero's scroll progress (0..1). */
  setProgress(p: number) {
    this.lastProgress = p;
    if (this.enabled) this.applyProgress(p);
  }

  private applyProgress(p: number) {
    if (!this.ctx || !this.shimmerGain) return;
    const swell = Math.min(p / 0.85, 1);
    const settled = p > 0.95 ? 0.35 : 1;
    this.shimmerGain.gain.setTargetAtTime(0.045 * swell * settled, this.ctx.currentTime, 0.2);
  }

  private schedulePing() {
    if (!this.enabled) return;
    this.pingTimer = window.setTimeout(() => {
      this.ping();
      this.schedulePing();
    }, 3000 + Math.random() * 5000);
  }

  private ping() {
    if (!this.ctx || !this.master || !this.enabled) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1400 + Math.random() * 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.028, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(g).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  }
}

export const goldSound = new GoldSound();
