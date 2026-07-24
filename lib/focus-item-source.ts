export type FocusItemSource =
  | { type: "priority"; priorityId: string; label: string }
  | { type: "brain_dump"; text: string }
  | {
      type: "recurring_task";
      recurringTaskId: string;
      occurrenceId: string;
      label: string;
    };

export function getFocusItemSourceKey(source: FocusItemSource): string {
  switch (source.type) {
    case "priority":
      return `priority:${source.priorityId}`;
    case "brain_dump":
      return `brain:${source.text.trim().toLowerCase()}`;
    case "recurring_task":
      return `recurring:${source.occurrenceId}`;
  }
}
