import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book log",
};

export default function ReadingJournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="journal-paper">{children}</div>;
}
