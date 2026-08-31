import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Draft",
  description: "Editable fantasy football draft rankings board.",
};

export default function DraftRankingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
