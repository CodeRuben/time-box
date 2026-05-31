import { useCallback, useEffect, useRef, useState } from "react";
import {
  playTimerCompleteSound,
  unlockTimerCompleteSound,
} from "@/lib/timer-complete-sound";

const INITIAL_SECONDS = 120;

export function formatMmSs(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function useTwoMinuteCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const prevSecondsRef = useRef<number | null>(null);

  const play = useCallback(() => {
    void unlockTimerCompleteSound();
    setSecondsLeft((s) => (s === 0 ? INITIAL_SECONDS : s));
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(INITIAL_SECONDS);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    const prev = prevSecondsRef.current;
    prevSecondsRef.current = secondsLeft;
    if (prev === 1 && secondsLeft === 0) {
      playTimerCompleteSound();
    }
  }, [secondsLeft]);

  return {
    secondsLeft,
    isRunning,
    play,
    pause,
    reset,
    display: formatMmSs(secondsLeft),
  };
}
