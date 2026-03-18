import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workout Tracker",
};

export default function WorkoutTrackerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
