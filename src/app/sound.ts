/**
 * Zero-asset Web Audio tactile feedback synthesizer.
 * Audio is strictly OFF by default and only fires when the user explicitly
 * enables sound. Every sound has a clear visual state equivalent.
 */

let audioCtx: AudioContext | null = null;

export function playSubtleCue(enabled: boolean, tone: 'nav' | 'select' | 'alert' = 'select'): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!audioCtx) {
      audioCtx = new AudioContextCtor();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const freq = tone === 'nav' ? 320 : tone === 'alert' ? 240 : 420;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Gracefully ignore when browser blocks audio or lacks Web Audio API
  }
}
