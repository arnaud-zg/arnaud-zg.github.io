// Every sound of the mission is made here, live, with the Web Audio API: square, triangle and
// saw waves and filtered noise. No recording, no sample, no borrowed tune: every melody is ours.
const MUTED = "mission-muted";
const note = (n: number) => 440 * 2 ** ((n - 69) / 12); // MIDI number to hertz

type Tone = { type?: OscillatorType; vol?: number; to?: number; at?: number };
type Noise = { vol?: number; from?: number; to?: number; at?: number };

export class Sound {
  private ctx: AudioContext | undefined;
  private master: GainNode | undefined;
  private noiseBuf: AudioBuffer | undefined;
  private loop: number | undefined;
  private step = 0;
  private nextAt = 0;
  // A browser that blocks storage still plays, unmuted, and forgets the choice.
  muted = (() => {
    try {
      return localStorage.getItem(MUTED) === "1";
    } catch {
      return false;
    }
  })();

  start() {
    if (this.ctx || !("AudioContext" in window)) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    void this.ctx.resume();
  }

  toggle() {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTED, this.muted ? "1" : "0");
    } catch {
      // kept for this visit only
    }
    if (this.ctx && this.master)
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    return this.muted;
  }

  stop() {
    this.music(undefined);
    void this.ctx?.close();
    this.ctx = undefined;
  }

  private tone(
    freq: number,
    dur: number,
    { type = "square", vol = 0.12, to = freq, at = 0 }: Tone = {},
  ) {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, { vol = 0.2, from = 2000, to = 200, at = 0 }: Noise = {}) {
    const { ctx, master, noiseBuf } = this;
    if (!ctx || !master || !noiseBuf) return;
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  // ── The intro ───────────────────────────────────────────────────────────────────────────
  // A letter landing on the badge: a bright tick, higher for each.
  letter(i: number) {
    this.tone(note(76 + i * 2), 0.06, { vol: 0.05 });
    this.tone(note(64 + i * 2), 0.08, { type: "triangle", vol: 0.08 });
  }
  // The badge complete: a low hit, then a climbing chord that rings out. Our own chime.
  chime() {
    this.tone(55, 0.6, { type: "sine", to: 40, vol: 0.32 });
    this.noise(0.3, { vol: 0.12, from: 5000, to: 500 });
    [60, 67, 71, 74, 79, 83].forEach((n, i) => {
      this.tone(note(n), 1.1 - i * 0.1, { type: "triangle", vol: 0.1, at: 0.08 + i * 0.07 });
      this.tone(note(n + 12), 0.4, { vol: 0.025, at: 0.08 + i * 0.07 });
    });
  }
  shine() {
    this.tone(2400, 0.25, { type: "sine", to: 4800, vol: 0.03 });
  }
  stamp() {
    this.noise(0.12, { vol: 0.28, from: 4000, to: 600 });
    this.tone(160, 0.1, { to: 60, vol: 0.12 });
  }
  press() {
    [72, 76, 79, 84, 88].forEach((n, i) => this.tone(note(n), 0.08, { vol: 0.07, at: i * 0.05 }));
  }

  // ── The fight ───────────────────────────────────────────────────────────────────────────
  shoot(heavy = false) {
    this.tone(heavy ? 620 : 980, 0.07, { to: 200, vol: 0.055 });
    this.noise(0.04, { vol: 0.05, from: 6000, to: 2000 });
  }
  pellets() {
    this.noise(0.14, { vol: 0.2, from: 3500, to: 400 });
    this.tone(260, 0.1, { to: 90, vol: 0.08 });
  }
  rocket() {
    this.noise(0.35, { vol: 0.12, from: 1200, to: 3000 });
  }
  flame() {
    this.noise(0.06, { vol: 0.06, from: 1800, to: 900 });
  }
  slash() {
    this.noise(0.08, { vol: 0.14, from: 7000, to: 3000 });
    this.tone(1400, 0.06, { to: 500, vol: 0.05 });
  }
  empty() {
    this.tone(220, 0.05, { vol: 0.06 });
    this.tone(180, 0.05, { vol: 0.06, at: 0.07 });
  }
  hit() {
    this.noise(0.08, { vol: 0.12, from: 2600, to: 600 });
  }
  crate() {
    this.noise(0.22, { vol: 0.22, from: 3000, to: 300 });
    this.tone(220, 0.16, { to: 70, vol: 0.1 });
  }
  pickup() {
    [72, 76, 79, 84].forEach((n, i) => this.tone(note(n), 0.09, { vol: 0.08, at: i * 0.06 }));
  }
  oneUp() {
    [76, 79, 88, 84, 86, 91].forEach((n, i) =>
      this.tone(note(n), 0.08, { vol: 0.08, at: i * 0.07 }),
    );
  }
  free() {
    [67, 72, 67, 76].forEach((n, i) =>
      this.tone(note(n), 0.07, { type: "triangle", vol: 0.12, at: i * 0.08 }),
    );
  }
  squash() {
    this.tone(320, 0.12, { to: 60, vol: 0.1 });
  }
  enemyShot() {
    this.tone(520, 0.08, { to: 300, vol: 0.04 });
  }
  jump() {
    this.tone(300, 0.1, { to: 600, vol: 0.04 });
  }
  splash() {
    this.noise(0.18, { vol: 0.08, from: 4000, to: 1200 });
  }
  toss() {
    this.tone(500, 0.12, { to: 900, vol: 0.04, type: "triangle" });
  }
  boom(big = false) {
    this.noise(big ? 1.1 : 0.5, { vol: big ? 0.4 : 0.26, from: 2400, to: 80 });
    this.tone(big ? 90 : 120, big ? 0.8 : 0.35, { type: "sine", to: 30, vol: 0.3 });
  }
  thud() {
    this.tone(110, 0.2, { type: "sine", to: 40, vol: 0.28 });
    this.noise(0.15, { vol: 0.12, from: 600, to: 100 });
  }
  charge() {
    this.tone(200, 0.8, { type: "sawtooth", to: 1200, vol: 0.035 });
  }
  roar() {
    this.tone(90, 1, { type: "sawtooth", to: 45, vol: 0.12 });
    this.noise(1, { vol: 0.15, from: 900, to: 150 });
  }
  death() {
    [64, 60, 57, 52, 48].forEach((n, i) => this.tone(note(n), 0.12, { vol: 0.08, at: i * 0.09 }));
    this.noise(0.3, { vol: 0.15, from: 2000, to: 200 });
  }
  type() {
    this.tone(1320, 0.02, { vol: 0.025 });
  }
  go() {
    this.tone(note(67), 0.12, { type: "triangle", vol: 0.2 });
    this.tone(note(79), 0.35, { type: "triangle", vol: 0.2, at: 0.13 });
  }
  warn() {
    for (let i = 0; i < 6; i++) this.tone(i % 2 ? 330 : 440, 0.18, { vol: 0.07, at: i * 0.2 });
  }
  tick() {
    this.tone(880, 0.05, { vol: 0.05 });
  }
  fanfare() {
    const tune: [number, number][] = [
      [67, 0.12],
      [72, 0.12],
      [76, 0.12],
      [79, 0.3],
      [76, 0.12],
      [79, 0.6],
    ];
    let at = 0;
    for (const [n, d] of tune) {
      this.tone(note(n), d + 0.05, { type: "square", vol: 0.07, at });
      this.tone(note(n - 12), d + 0.05, { type: "triangle", vol: 0.16, at });
      at += d;
    }
  }
  gameOver() {
    const tune: [number, number][] = [
      [64, 0.3],
      [62, 0.3],
      [60, 0.3],
      [59, 0.3],
      [57, 0.9],
    ];
    let at = 0;
    for (const [n, d] of tune) {
      this.tone(note(n), d, { type: "triangle", vol: 0.14, at });
      at += d;
    }
  }

  // The map's bass loop, scheduled a little ahead so it never stumbles; quicker for the boss.
  music(
    riff: { readonly riff: readonly number[]; readonly step: number } | undefined,
    boss = false,
  ) {
    if (this.loop !== undefined) clearInterval(this.loop);
    this.loop = undefined;
    const { ctx } = this;
    if (!riff || !ctx) return;
    const stepDur = riff.step * (boss ? 0.8 : 1);
    this.nextAt = ctx.currentTime + 0.05;
    this.loop = window.setInterval(() => {
      while (this.ctx && this.nextAt < this.ctx.currentTime + 0.12) {
        const at = this.nextAt - this.ctx.currentTime;
        const n = riff.riff.at(this.step % riff.riff.length) ?? 0;
        if (n) this.tone(note(n), stepDur * 0.9, { type: "triangle", vol: 0.16, at });
        if (this.step % 4 === 0) this.tone(140, 0.12, { type: "sine", to: 45, vol: 0.22, at });
        if (this.step % 2 === 1) this.noise(0.03, { vol: 0.035, from: 9000, to: 5000, at });
        if (boss && this.step % 8 === 4) this.noise(0.1, { vol: 0.08, from: 3000, to: 800, at });
        if (boss && n && this.step % 4 === 2)
          this.tone(note(n + 24), stepDur * 0.5, { vol: 0.025, at });
        this.step++;
        this.nextAt += stepDur;
      }
    }, 25);
  }
}
