function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (
      window as unknown as {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

let context: AudioContext | null = null;

export function getWebAudioContext(): AudioContext | null {
  if (!context) context = createAudioContext();
  return context;
}

/** Must run from a user gesture before delayed sounds reliably work. */
export async function resumeWebAudioContext(): Promise<void> {
  const c = getWebAudioContext();
  if (!c || c.state === "closed") return;
  await c.resume().catch(() => {});
}

function runWhenRunning(c: AudioContext, fn: () => void) {
  if (c.state === "closed") return;
  if (c.state === "suspended") {
    void c.resume().then(fn).catch(() => {});
    return;
  }
  fn();
}

export function playOscillatorBeep(
  c: AudioContext,
  opts: {
    type: OscillatorType;
    frequency: number;
    durationSec: number;
    peakGain: number;
    attackSec?: number;
    releaseSec?: number;
  }
): void {
  const {
    type,
    frequency,
    durationSec,
    peakGain,
    attackSec = 0.02,
    releaseSec = 0.12,
  } = opts;
  runWhenRunning(c, () => {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + attackSec);
    gain.gain.linearRampToValueAtTime(0, t + durationSec);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + durationSec + releaseSec);
  });
}

export function playNoiseTick(
  c: AudioContext,
  opts: { durationSec?: number; peakGain?: number } = {}
): void {
  const durationSec = opts.durationSec ?? 0.04;
  const peakGain = opts.peakGain ?? 0.08;
  runWhenRunning(c, () => {
    const t = c.currentTime;
    const len = Math.max(1, Math.floor(c.sampleRate * durationSec));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.005);
    gain.gain.linearRampToValueAtTime(0, t + durationSec);
    src.connect(gain);
    gain.connect(c.destination);
    src.start(t);
    src.stop(t + durationSec + 0.02);
  });
}

export function playToneSequence(
  c: AudioContext,
  notes: {
    freq: number;
    delay: number;
    durationSec: number;
    peakGain?: number;
  }[],
  opts: { type?: OscillatorType; peakGain?: number } = {}
): void {
  const type = opts.type ?? "sine";
  runWhenRunning(c, () => {
    const base = c.currentTime;
    for (const n of notes) {
      const t = base + n.delay;
      const peak = n.peakGain ?? opts.peakGain ?? 0.09;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(n.freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.02);
      gain.gain.linearRampToValueAtTime(0, t + n.durationSec);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + n.durationSec + 0.05);
    }
  });
}
