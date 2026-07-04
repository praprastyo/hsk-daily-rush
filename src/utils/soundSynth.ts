// Programmatic Audio Synthesizer using Web Audio API

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export type SoundType = 'ding' | 'buzz' | 'whoosh' | 'chime' | 'click';

export function playSound(type: SoundType) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (type) {
      case 'click': {
        // Simple crisp button click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'ding': {
        // A cheerful, crisp "Ding!" (Success)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now); // G5
        osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6

        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
        break;
      }
      case 'buzz': {
        // A low, vibrating "Buzz" (Failure)
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130.81, now); // C3
        osc.frequency.linearRampToValueAtTime(110.00, now + 0.25); // A2

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
      case 'whoosh': {
        // A smooth sweep (Transition)
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'chime': {
        // Sparkly, magical chime (Hint)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + index * 0.06);

          gainNode.gain.setValueAtTime(0.0, now + index * 0.06);
          gainNode.gain.linearRampToValueAtTime(0.15, now + index * 0.06 + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.3);

          osc.start(now + index * 0.06);
          osc.stop(now + index * 0.06 + 0.35);
        });
        break;
      }
    }
  } catch (e) {
    console.warn('Web Audio synthesis not supported or blocked:', e);
  }
}

// ───────────────────────────────────────────────────────────
// Mandarin tone synthesizer
// Simulates the 4 standard Mandarin tone contours using pitch
// ramps on a single oscillator. Tone 0 = neutral (light, short).
// ───────────────────────────────────────────────────────────
export type PinyinTone = 0 | 1 | 2 | 3 | 4;

export function playPinyinTone(tone: PinyinTone) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';

    const base = 220; // A3 reference pitch
    const dur = tone === 0 ? 0.28 : 0.6;

    const f = osc.frequency;
    switch (tone) {
      case 1: // high, level
        f.setValueAtTime(base * 1.5, now);
        f.linearRampToValueAtTime(base * 1.5, now + dur);
        break;
      case 2: // rising
        f.setValueAtTime(base * 1.05, now);
        f.linearRampToValueAtTime(base * 1.7, now + dur);
        break;
      case 3: // dipping (fall then rise)
        f.setValueAtTime(base * 1.15, now);
        f.linearRampToValueAtTime(base * 0.8, now + dur * 0.45);
        f.linearRampToValueAtTime(base * 1.45, now + dur);
        break;
      case 4: // falling
        f.setValueAtTime(base * 1.8, now);
        f.linearRampToValueAtTime(base * 0.85, now + dur);
        break;
      default: // neutral / light
        f.setValueAtTime(base * 1.3, now);
        f.linearRampToValueAtTime(base * 1.2, now + dur);
        break;
    }

    // Soft attack + release envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
    gain.gain.setValueAtTime(0.22, now + dur - 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.start(now);
    osc.stop(now + dur + 0.05);
  } catch (e) {
    console.warn('Web Audio tone synthesis not supported or blocked:', e);
  }
}

// Plays the 4 standard tones in sequence for a given syllable preview.
export function playToneSequence() {
  try {
    const ctx = getAudioContext();
    const tones: PinyinTone[] = [1, 2, 3, 4];
    tones.forEach((t, i) => {
      setTimeout(() => playPinyinTone(t), i * 700);
    });
    void ctx;
  } catch (e) {
    console.warn('Web Audio tone sequence not supported or blocked:', e);
  }
}
