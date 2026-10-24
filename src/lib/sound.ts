/**
 * Çok hafif, ince bir ses efekti. Dosya yok: Web Audio ile anlık üretilir.
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

    // Yumuşak giriş (tık sesi olmasın) ve uzun, hafif sönüş
    const start = now + n.at;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(n.peak, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.duration);

    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + n.duration + 0.02);
  }
}

/** Kayıt başarılı: kısa, ince ve çok alçak sesli iki nota. */
export function playSuccess() {
  play([
    { freq: 1318.51, at: 0, duration: 0.3, peak: 0.035 },
    { freq: 1760, at: 0.07, duration: 0.4, peak: 0.025 },
  ]);
}

/** Kayıt silindi: tek, çok hafif bir nota. */
export function playClear() {
  play([{ freq: 880, at: 0, duration: 0.22, peak: 0.025 }]);
}
