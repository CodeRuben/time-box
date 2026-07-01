import type { FocusListItem } from "@/lib/focus-list";

export function createMockFocusListItems(): FocusListItem[] {
  return [
    {
      id: "mock-focus-1",
      source: { type: "brain_dump", text: "Review project roadmap" },
      status: "complete",
      order: 0,
    },
    {
      id: "mock-focus-2",
      source: { type: "brain_dump", text: "Reply to client emails" },
      status: "complete",
      order: 1,
    },
    {
      id: "mock-focus-3",
      source: { type: "brain_dump", text: "Prepare standup notes" },
      status: "complete",
      order: 2,
    },
    {
      id: "mock-focus-4",
      source: { type: "brain_dump", text: "Deep work on feature branch" },
      status: "todo",
      order: 0,
    },
    {
      id: "mock-focus-5",
      source: { type: "brain_dump", text: "Update documentation" },
      status: "todo",
      order: 1,
    },
    {
      id: "mock-focus-6",
      source: { type: "brain_dump", text: "Team sync prep" },
      status: "todo",
      order: 2,
    },
  ];
}
