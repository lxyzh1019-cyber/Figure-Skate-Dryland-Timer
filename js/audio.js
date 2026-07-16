/* ============================================================================
   audio.js — coach voice (Web Speech TTS) + tick/finish beeps (Web Audio).
   The coach-voice toggle gates ALL speech: when off (or when the browser has no
   voices, e.g. headless), speakAndWait() resolves immediately so a session can
   run fast and unattended. Tick beeps never fire while speech is active.
   ============================================================================ */
import { loadSettings } from "./store.js";

let audioCtx = null;
let speaking = false;

function voiceOn() { return !!loadSettings().coachVoiceOn; }

/* Lazily create the AudioContext on first use (needs a user gesture on some
   browsers; callers invoke from click handlers). */
function ensureAudio() {
  if (audioCtx) return audioCtx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  } catch { audioCtx = null; }
  return audioCtx;
}

export function primeAudio() { const c = ensureAudio(); if (c && c.state === "suspended") c.resume().catch(() => {}); }

/* Speak `text` and resolve when done. Resolves immediately if voice is off or
   the platform exposes no voices. Never rejects. */
export function speakAndWait(text) {
  return new Promise((resolve) => {
    try {
      if (!text || !voiceOn() || !("speechSynthesis" in window)) return resolve();
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return resolve(); // headless / no TTS
      const u = new SpeechSynthesisUtterance(String(text));
      const style = loadSettings().voiceStyle;
      u.rate = style === "calm" ? 0.9 : style === "peppy" ? 1.08 : 1.0;
      u.pitch = style === "peppy" ? 1.15 : 1.0;
      let done = false;
      const finish = () => { if (done) return; done = true; speaking = false; resolve(); };
      u.onend = finish; u.onerror = finish;
      speaking = true;
      window.speechSynthesis.speak(u);
      // Failsafe: never hang the session if the engine drops the event.
      setTimeout(finish, Math.min(12000, 1500 + String(text).length * 90));
    } catch { speaking = false; resolve(); }
  });
}

export function cancelSpeech() {
  try { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); } catch {}
  speaking = false;
}

function tone(freq, ms, gain = 0.12) {
  const c = ensureAudio();
  if (!c || speaking) return;              // never beep over speech
  try {
    const osc = c.createOscillator(), g = c.createGain();
    osc.frequency.value = freq; osc.type = "sine";
    g.gain.value = gain;
    osc.connect(g); g.connect(c.destination);
    const t = c.currentTime;
    osc.start(t); osc.stop(t + ms / 1000);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  } catch {}
}

export function tickBeep()  { tone(660, 90, 0.08); }   // last few seconds
export function finishBeep() { tone(880, 220, 0.14); } // phase complete
