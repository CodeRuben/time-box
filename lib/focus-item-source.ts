export type FocusItemSource =
  | { type: "priority"; priorityId: string; label: string }
  | { type: "task"; taskId: string; label: string }
  | { type: "brain_dump"; text: string };

export function getFocusItemSourceKey(source: FocusItemSource): string {
  switch (source.type) {
    case "priority":
      return `priority:${source.priorityId}`;
    case "task":
      return `task:${source.taskId}`;
    case "brain_dump":
      return `brain:${source.text.trim().toLowerCase()}`;
  }
}
