export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskType = "work" | "personal";

export interface ChecklistItem {
  id: string;
  name: string;
  completed: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  checklist: ChecklistItem[];
  status: TaskStatus;
  type: TaskType;
  createdAt: string;
  updatedAt: string;
}

export interface NewTask {
  name: string;
  description: string;
  checklist: ChecklistItem[];
  status: TaskStatus;
  type: TaskType;
}

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
];
