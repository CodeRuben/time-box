import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task Manager",
};

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
