/**
 * Küçük, yumuşak ses efektleri. Dosya yok: Web Audio ile anlık üretilir.
 * Ses, kullanıcının dokunuşu sırasında çağrıldığında çalar (iOS bunu şart koşar).
 * Not: iPhone'da yan sessiz anahtarı açıksa tarayıcı sesleri çalmaz.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

function getContext(): AudioContext | null {
  if (!enabled) return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

type Note = { freq: number; at: number; duration: number; peak: number };

function play(notes: Note[]) {
  const audio = getContext();
  if (!audio) return;
  const now = audio.currentTime;

  for (const n of notes) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = n.freq;

    const start = now + n.at;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(n.peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.duration);

    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + n.duration + 0.02);
  }
}

/** Saat butonlarına dokunurken: çok hafif bir tık. */
export function playTick() {
  play([{ freq: 1046.5, at: 0, duration: 0.07, peak: 0.05 }]);
}

/** Kayıt başarılı: iki notalı yumuşak, parlak bir çan sesi. */
export function playSuccess() {
  play([
    { freq: 783.99, at: 0, duration: 0.5, peak: 0.14 },
    { freq: 1174.66, at: 0.09, duration: 0.65, peak: 0.12 },
    { freq: 1567.98, at: 0.09, duration: 0.45, peak: 0.03 },
  ]);
}

/** Kayıt silindi: kısa, alçalan bir ses. */
export function playClear() {
  play([
    { freq: 587.33, at: 0, duration: 0.25, peak: 0.1 },
    { freq: 392, at: 0.08, duration: 0.35, peak: 0.09 },
  ]);
}
