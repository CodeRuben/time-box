import type { ChecklistItem, NewTask } from "@/lib/task-types";

export type TaskTemplateId = "blank" | "jira";

type TaskTemplateValues = Pick<
  NewTask,
  "description" | "status" | "type" | "checklist"
>;

export const DEFAULT_TASK_TEMPLATE_ID: TaskTemplateId = "blank";

export const TASK_TEMPLATE_OPTIONS: { value: TaskTemplateId; label: string }[] =
  [
    { value: "blank", label: "Blank task" },
    { value: "jira", label: "Jira task" },
  ];

const JIRA_TASK_CHECKLIST_ITEMS = [
  "Implement task",
  "Code review",
  "UXAT/PAT approvals",
  "QA testing",
  "HICE/RB approval",
  "Merge to master/Deploy to stage",
  "Deploy to production",
];

function createChecklistItems(names: string[]): ChecklistItem[] {
  return names.map((name) => ({
    id: crypto.randomUUID(),
    name,
    completed: false,
  }));
}

export function getTaskTemplateValues(
  templateId: TaskTemplateId
): TaskTemplateValues {
  switch (templateId) {
    case "jira":
      return {
        description: "",
        status: "todo",
        type: "work",
        checklist: createChecklistItems(JIRA_TASK_CHECKLIST_ITEMS),
      };
    case "blank":
    default:
      return {
        description: "",
        status: "todo",
        type: "personal",
        checklist: [],
      };
  }
}
