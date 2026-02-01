"use client";

import { useState, useEffect, useCallback } from "react";
import { HOURS } from "@/app/planner/constants";

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  timeSlot: string; // e.g., "9:00 AM"
  dismissed: boolean;
  createdAt: string; // ISO timestamp
}

export type NewReminder = Omit<Reminder, "id" | "createdAt" | "dismissed">;

const STORAGE_KEY = "reminders";

/**
 * Generate all valid time slot options in "H:MM AM/PM" format
 */
export function getTimeSlotOptions(): string[] {
  const options: string[] = [];
  for (const hour of HOURS) {
    // HOURS has format like "7 AM", "12 PM"
    const match = hour.match(/^(\d+)\s+(AM|PM)$/);
    if (match) {
      const hourNum = match[1];
      const period = match[2];
      options.push(`${hourNum}:00 ${period}`);
      options.push(`${hourNum}:30 ${period}`);
    }
  }
  return options;
}

/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a time slot string to get hour in 24h format
 * e.g., "9:00 AM" -> 9, "2:30 PM" -> 14
 */
export function parseTimeSlotHour(timeSlot: string): number {
  const match = timeSlot.match(/^(\d+):(\d+)\s+(AM|PM)$/);
  if (!match) return 0;

  let hour = parseInt(match[1], 10);
  const period = match[3];
  
  if (period === "PM" && hour !== 12) {
    hour += 12;
  } else if (period === "AM" && hour === 12) {
    hour = 0;
  }
  
  return hour;
}

/**
 * Parse a time slot to get minutes (0 or 30)
 * e.g., "9:00 AM" -> 0, "2:30 PM" -> 30
 */
export function parseTimeSlotMinutes(timeSlot: string): number {
  const match = timeSlot.match(/^(\d+):(\d+)\s+(AM|PM)$/);
  return match ? parseInt(match[2], 10) : 0;
}

/**
 * Check if a reminder is past due
 */
export function isReminderPastDue(reminder: Reminder): boolean {
  if (reminder.dismissed) return false;

  const now = new Date();
  const reminderDate = new Date(reminder.date);
  
  // Compare dates first
  const todayKey = formatDateKey(now);
  
  if (reminder.date < todayKey) {
    return true;
  }
  
  if (reminder.date > todayKey) {
    return false;
  }
  
  // Same day - compare time
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const reminderHour = parseTimeSlotHour(reminder.timeSlot);
  const reminderMinutes = parseTimeSlotMinutes(reminder.timeSlot);
  
  if (currentHour > reminderHour) return true;
  if (currentHour === reminderHour && currentMinutes > reminderMinutes) return true;
  
  return false;
}

/**
 * Check if a reminder is upcoming (today or future, not past due)
 */
export function isReminderUpcoming(reminder: Reminder): boolean {
  if (reminder.dismissed) return false;
  
  const todayKey = formatDateKey(new Date());
  
  // Future dates are upcoming
  if (reminder.date > todayKey) return true;
  
  // Past dates are not upcoming
  if (reminder.date < todayKey) return false;
  
  // Same day - check if not past due
  return !isReminderPastDue(reminder);
}

/**
 * Load reminders from localStorage
 */
function loadReminders(): Reminder[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    return parsed;
  } catch (error) {
    console.error("Failed to load reminders:", error);
    return [];
  }
}

/**
 * Save reminders to localStorage
 */
function saveReminders(reminders: Reminder[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded. Reminders not saved.");
    } else {
      console.error("Failed to save reminders:", error);
    }
  }
}

/**
 * Hook to manage reminders with localStorage persistence
 */
export function useReminderStorage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reminders on mount
  useEffect(() => {
    const loaded = loadReminders();
    setReminders(loaded);
    setIsLoading(false);
  }, []);

  // Add a new reminder
  const addReminder = useCallback((newReminder: NewReminder) => {
    const reminder: Reminder = {
      ...newReminder,
      id: crypto.randomUUID(),
      dismissed: false,
      createdAt: new Date().toISOString(),
    };

    setReminders((prev) => {
      const updated = [...prev, reminder];
      saveReminders(updated);
      return updated;
    });

    return reminder;
  }, []);

  // Update an existing reminder
  const updateReminder = useCallback((id: string, updates: Partial<Omit<Reminder, "id" | "createdAt">>) => {
    setReminders((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      saveReminders(updated);
      return updated;
    });
  }, []);

  // Delete a reminder
  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveReminders(updated);
      return updated;
    });
  }, []);

  // Dismiss a reminder
  const dismissReminder = useCallback((id: string) => {
    updateReminder(id, { dismissed: true });
  }, [updateReminder]);

  // Get reminders for a specific date and time slot
  const getRemindersForSlot = useCallback((date: Date, timeSlot: string): Reminder[] => {
    const dateKey = formatDateKey(date);
    return reminders.filter(
      (r) => r.date === dateKey && r.timeSlot === timeSlot
    );
  }, [reminders]);

  // Get all reminders for a specific date
  const getRemindersForDate = useCallback((date: Date): Reminder[] => {
    const dateKey = formatDateKey(date);
    return reminders.filter((r) => r.date === dateKey);
  }, [reminders]);

  // Get past due reminders (not dismissed)
  const getPastDueReminders = useCallback((): Reminder[] => {
    return reminders.filter(isReminderPastDue);
  }, [reminders]);

  // Get upcoming reminders (today and future, not dismissed)
  const getUpcomingReminders = useCallback((): Reminder[] => {
    return reminders
      .filter(isReminderUpcoming)
      .sort((a, b) => {
        // Sort by date first
        if (a.date !== b.date) {
          return a.date < b.date ? -1 : 1;
        }
        // Then by time slot
        const aHour = parseTimeSlotHour(a.timeSlot);
        const bHour = parseTimeSlotHour(b.timeSlot);
        if (aHour !== bHour) return aHour - bHour;
        
        const aMin = parseTimeSlotMinutes(a.timeSlot);
        const bMin = parseTimeSlotMinutes(b.timeSlot);
        return aMin - bMin;
      });
  }, [reminders]);

  return {
    reminders,
    isLoading,
    addReminder,
    updateReminder,
    deleteReminder,
    dismissReminder,
    getRemindersForSlot,
    getRemindersForDate,
    getPastDueReminders,
    getUpcomingReminders,
  };
}
