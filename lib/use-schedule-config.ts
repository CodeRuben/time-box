"use client";

import { useState, useEffect, useCallback } from "react";

export interface ScheduleConfig {
  startHour: number; // 5-11 (5 AM to 11 AM)
  endHour: number; // 12-23 (12 PM to 11 PM)
}

const STORAGE_KEY = "schedule-config";

const DEFAULT_CONFIG: ScheduleConfig = {
  startHour: 7,
  endHour: 23,
};

/**
 * Load schedule config from localStorage
 */
export function loadScheduleConfig(): ScheduleConfig {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_CONFIG;
    }

    const parsed = JSON.parse(stored) as ScheduleConfig;

    // Validate the parsed config
    if (
      typeof parsed.startHour === "number" &&
      typeof parsed.endHour === "number" &&
      parsed.startHour >= 5 &&
      parsed.startHour <= 11 &&
      parsed.endHour >= 12 &&
      parsed.endHour <= 23 &&
      parsed.startHour < parsed.endHour
    ) {
      return parsed;
    }

    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Save schedule config to localStorage
 */
export function saveScheduleConfig(config: ScheduleConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save schedule config:", error);
  }
}

/**
 * Hook to manage schedule configuration with localStorage persistence
 */
export function useScheduleConfig() {
  const [config, setConfig] = useState<ScheduleConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Load config on mount
  useEffect(() => {
    const loaded = loadScheduleConfig();
    setConfig(loaded);
    setIsLoading(false);
  }, []);

  // Update config and save to localStorage
  const updateConfig = useCallback((newConfig: ScheduleConfig) => {
    setConfig(newConfig);
    saveScheduleConfig(newConfig);
  }, []);

  return {
    config,
    updateConfig,
    isLoading,
  };
}

/**
 * Convert hour number to display format (e.g., 7 -> "7 AM", 13 -> "1 PM")
 */
export function hourToDisplayFormat(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Convert display format back to hour number (e.g., "7 AM" -> 7, "1 PM" -> 13)
 */
export function displayFormatToHour(display: string): number {
  const match = display.match(/^(\d+)\s+(AM|PM)$/);
  if (!match) return 0;

  const num = parseInt(match[1], 10);
  const period = match[2];

  if (period === "AM") {
    return num === 12 ? 0 : num;
  } else {
    return num === 12 ? 12 : num + 12;
  }
}
