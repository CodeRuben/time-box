import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Draft",
  description: "Fantasy football snake mock drafts against AI opponents.",
};

export default function MockDraftLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
