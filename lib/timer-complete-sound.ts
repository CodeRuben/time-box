import {
  getWebAudioContext,
  playToneSequence,
  resumeWebAudioContext,
} from "@/lib/web-audio-context";

/** Call from a user gesture (e.g. Start) so completion sound can play after the delay. */
export async function unlockTimerCompleteSound(): Promise<void> {
  await resumeWebAudioContext();
}

/** Two-note sine chime (same as former number-pad “9” sound). */
export function playTimerCompleteSound(): void {
  const c = getWebAudioContext();
  if (!c) return;
  playToneSequence(
    c,
    [
      { freq: 587.33, delay: 0, durationSec: 0.08, peakGain: 0.08 },
      { freq: 783.99, delay: 0.09, durationSec: 0.1, peakGain: 0.07 },
    ],
    { type: "sine" }
  );
}
