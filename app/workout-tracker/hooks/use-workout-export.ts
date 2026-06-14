"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import {
  downloadWorkoutCsv,
  hydrateWorkoutExportDays,
  workoutDaysToCsv,
  type WorkoutExportDay,
} from "@/lib/workout-export";
import {
  getStorageMode,
  loadAllLocalWorkoutDays,
} from "@/lib/use-workout-storage";

async function fetchAccountWorkoutDays(): Promise<WorkoutExportDay[]> {
  const response = await fetch("/api/workouts/export", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Failed to load workout data for export");
  }

  const payload = (await response.json()) as { days?: unknown };
  return hydrateWorkoutExportDays(payload.days);
}

export function useWorkoutExport() {
  const { status } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportWorkouts = useCallback(async () => {
    const mode = getStorageMode(status);
    if (!mode) {
      return;
    }

    setIsExporting(true);

    try {
      const days =
        mode === "local"
          ? loadAllLocalWorkoutDays()
          : await fetchAccountWorkoutDays();
      const csv = workoutDaysToCsv(days);
      downloadWorkoutCsv(csv);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to export workouts:", error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [status]);

  return {
    isDialogOpen,
    setIsDialogOpen,
    isExporting,
    exportWorkouts,
    isReady: status !== "loading",
  };
}
