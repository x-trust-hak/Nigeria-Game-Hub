import { useRef, useCallback } from "react";

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (sharedCtx.state === "suspended") {
      sharedCtx.resume();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  gainVal: number,
  freqEnd?: number,
) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
  }
  gain.gain.setValueAtTime(gainVal, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

export function useGameSounds() {
  const playWin = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Ascending arpeggio: C5 E5 G5 C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      playTone(freq, "sine", t + i * 0.09, 0.35, 0.25);
    });
    // Add a shimmer
    playTone(2093, "sine", t + 0.36, 0.4, 0.1, 1500);
  }, []);

  const playLose = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Descending wah
    playTone(320, "sawtooth", t, 0.12, 0.15, 200);
    playTone(200, "sawtooth", t + 0.15, 0.35, 0.12, 80);
  }, []);

  const playSpin = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Rising whoosh
    playTone(120, "sine", t, 0.25, 0.12, 380);
    playTone(80,  "sine", t, 0.25, 0.08, 200);
  }, []);

  const playTick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    playTone(880, "square", t, 0.04, 0.06);
  }, []);

  const playClick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    playTone(440, "sine", t, 0.06, 0.08);
  }, []);

  const playBigWin = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Fanfare
    const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1046.50, 783.99, 1046.50];
    fanfare.forEach((freq, i) => {
      playTone(freq, "sine", t + i * 0.07, 0.3, 0.2);
    });
    // Bass hit
    playTone(65, "sine", t, 0.4, 0.3, 55);
  }, []);

  return { playWin, playLose, playSpin, playTick, playClick, playBigWin };
}
