import { hourToDisplayFormat } from "@/lib/use-schedule-config";

// Maximum number of chips to display in a time slot card
export const MAX_VISIBLE_CHIPS = 2;

/**
 * Format a time slot key for display.
 * Converts "7 AM:00" to "7:00 AM" or "7 AM:30" to "7:30 AM"
 */
export const formatTimeSlot = (slotKey: string): string => {
  const match = slotKey.match(/^(\d+)\s+(AM|PM):(\d+)$/);
  if (!match) return slotKey;
  return `${match[1]}:${match[3]} ${match[2]}`;
};

// Full range of available hours (5 AM to 11 PM)
export const ALL_HOURS = [
  "5 AM",
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
  "11 PM",
];

// Default hours (backward compatible - 7 AM to 11 PM)
export const HOURS = ALL_HOURS.slice(2); // Start from "7 AM"/**

export function getHoursInRange(startHour: number, endHour: number): string[] {
  const result: string[] = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    result.push(hourToDisplayFormat(hour));
  }

  return result;
}
