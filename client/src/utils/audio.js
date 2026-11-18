// Web Audio API Procedural Sound Engine & Ambient Monopoly Lounge BGM
// Zero external file dependencies - 100% reliable, zero latency, zero CORS/load issues.

let audioCtx = null;
let bgmInterval = null;
let isBgmActive = false;
let isAudioMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ==========================================
// SOUND EFFECTS
// ==========================================

export function playDrawSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // White noise burst with bandpass sweep to simulate card friction/swoosh
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(3000, now + 0.12);
  filter.Q.value = 3.0;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.15);
}

export function playCardSnapSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Tactile wood/table card snap
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.07);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

export function playCoinSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Dual-tone high metallic coin clink
  [987.77, 1318.51].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0.2, now + idx * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.25);
  });
}

export function playRentSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Cash register cha-ching bell arpeggio
  const notes = [587.33, 880, 1174.66, 1760];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.05);

    gain.gain.setValueAtTime(0.25, now + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.05);
    osc.stop(now + idx * 0.05 + 0.35);
  });
}

export function playJustSayNoSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Deflection shield / buzzer sweep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(450, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.26);
}

export function playTurnStartSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Gentle high notification chime (E5 -> B5)
  [659.25, 987.77].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.09);

    gain.gain.setValueAtTime(0.2, now + idx * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.09);
    osc.stop(now + idx * 0.09 + 0.35);
  });
}

export function playVictorySound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Celebratory ascending major arpeggio (C4 -> E4 -> G4 -> C5)
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

    gain.gain.setValueAtTime(0.3, now + idx * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.12);
    osc.stop(now + idx * 0.12 + 0.8);
  });
}

// ==========================================
// SUBTLE MONOPOLY LOUNGE THEME BGM
// ==========================================
// Relaxing, classy electric-piano jazz chord progression (Cmaj7 -> Am7 -> Dm7 -> G7)
const JAZZ_CHORDS = [
  // Cmaj7: C3 bass, E4, G4, B4
  { bass: 130.81, notes: [329.63, 392.00, 493.88] },
  // Am7: A2 bass, C4, E4, G4
  { bass: 110.00, notes: [261.63, 329.63, 392.00] },
  // Dm7: D3 bass, F4, A4, C5
  { bass: 146.83, notes: [349.23, 440.00, 523.25] },
  // G7: G2 bass, B3, D4, F4
  { bass: 98.00,  notes: [246.94, 293.66, 349.23] }
];

let chordStep = 0;

function playLoungeChord() {
  if (isAudioMuted || !isBgmActive) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chord = JAZZ_CHORDS[chordStep % JAZZ_CHORDS.length];
  chordStep++;

  // 1. Warm Bass Note
  const bassOsc = ctx.createOscillator();
  const bassFilter = ctx.createBiquadFilter();
  const bassGain = ctx.createGain();

  bassOsc.type = 'triangle';
  bassOsc.frequency.setValueAtTime(chord.bass, now);

  bassFilter.type = 'lowpass';
  bassFilter.frequency.setValueAtTime(350, now);

  bassGain.gain.setValueAtTime(0.04, now);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

  bassOsc.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(ctx.destination);

  bassOsc.start(now);
  bassOsc.stop(now + 1.9);

  // 2. Soft Electric Piano Chord Notes
  chord.notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.02);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    gain.gain.setValueAtTime(0.025, now + idx * 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 1.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.02);
    osc.stop(now + 1.8);
  });
}

export function startBgm() {
  isBgmActive = true;
  if (bgmInterval) clearInterval(bgmInterval);
  playLoungeChord();
  bgmInterval = setInterval(() => {
    playLoungeChord();
  }, 2000);
}

export function stopBgm() {
  isBgmActive = false;
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
}

export function toggleAudioMute() {
  isAudioMuted = !isAudioMuted;
  if (isAudioMuted) {
    stopBgm();
  } else {
    startBgm();
  }
  return isAudioMuted;
}

export function getAudioMuted() {
  return isAudioMuted;
}
