import { describe, expect, it } from "vitest";

import {
  DEFAULT_TASK_TEMPLATE_ID,
  getTaskTemplateValues,
  TASK_TEMPLATE_OPTIONS,
} from "../task-templates";

describe("task templates", () => {
  it("defaults to the blank template", () => {
    expect(DEFAULT_TASK_TEMPLATE_ID).toBe("blank");
    expect(TASK_TEMPLATE_OPTIONS).toEqual([
      { value: "blank", label: "Blank task" },
      { value: "jira", label: "Jira task" },
    ]);
  });

  it("returns the default blank task values", () => {
    expect(getTaskTemplateValues("blank")).toEqual({
      description: "",
      status: "todo",
      type: "personal",
      checklist: [],
    });
  });

  it("builds the jira task template", () => {
    const template = getTaskTemplateValues("jira");

    expect(template.description).toBe("");
    expect(template.status).toBe("todo");
    expect(template.type).toBe("work");
    expect(template.checklist).toHaveLength(7);
    expect(template.checklist.map((item) => item.name)).toEqual([
      "Implement task",
      "Code review",
      "UXAT/PAT approvals",
      "QA testing",
      "HICE/RB approval",
      "Merge to master/Deploy to stage",
      "Deploy to production",
    ]);
    expect(template.checklist.every((item) => item.completed === false)).toBe(
      true
    );
    expect(template.checklist.every((item) => item.id.length > 0)).toBe(true);
  });
});
