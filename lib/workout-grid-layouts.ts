import type { WorkoutType } from "@/lib/use-workout-storage";

export type GridColumnKind = "text" | "number" | "reps" | "weight";
export type GridColumnWidth = "flex" | "narrow" | "medium";

export interface GridLayoutColumn {
  id: string;
  label: string;
  kind: GridColumnKind;
  width: GridColumnWidth;
  placeholder?: string;
}

export interface GridLayoutTemplate {
  id: string;
  name: string;
  description: string;
  columns: GridLayoutColumn[];
  defaultForTypes?: WorkoutType[];
}

export const DEFAULT_GRID_LAYOUT_ID = "simple-three-col";

export const GRID_LAYOUT_TEMPLATES: GridLayoutTemplate[] = [
  {
    id: "simple-three-col",
    name: "Simple 3-column",
    description: "Workout name, description, and weight",
    columns: [
      {
        id: "workoutName",
        label: "Workout name",
        kind: "text",
        width: "flex",
        placeholder: "Name",
      },
      {
        id: "description",
        label: "Description",
        kind: "text",
        width: "flex",
        placeholder: "—",
      },
      {
        id: "weight",
        label: "Weight",
        kind: "weight",
        width: "narrow",
        placeholder: "—",
      },
    ],
  },
  {
    id: "hybrid-reps-first",
    name: "Circuit",
    description: "Reps first, then exercise name",
    defaultForTypes: ["hybrid"],
    columns: [
      {
        id: "reps",
        label: "Reps",
        kind: "reps",
        width: "narrow",
        placeholder: "—",
      },
      {
        id: "workoutName",
        label: "Exercise",
        kind: "text",
        width: "flex",
        placeholder: "Exercise",
      },
    ],
  },
  {
    id: "resistance-sets",
    name: "Sets grid",
    description: "Exercise with three set columns",
    defaultForTypes: ["resistance"],
    columns: [
      {
        id: "workoutName",
        label: "Exercise",
        kind: "text",
        width: "flex",
        placeholder: "Exercise",
      },
      {
        id: "set1",
        label: "Set 1",
        kind: "number",
        width: "narrow",
        placeholder: "—",
      },
      {
        id: "set2",
        label: "Set 2",
        kind: "number",
        width: "narrow",
        placeholder: "—",
      },
      {
        id: "set3",
        label: "Set 3",
        kind: "number",
        width: "narrow",
        placeholder: "—",
      },
    ],
  },
  {
    id: "single-line",
    name: "Single line",
    description: "One quick text field per row",
    defaultForTypes: ["cardio", "unknown"],
    columns: [
      {
        id: "line",
        label: "Notes",
        kind: "text",
        width: "flex",
        placeholder: "Sub-workout item",
      },
    ],
  },
];

const GRID_LAYOUT_MAP = Object.fromEntries(
  GRID_LAYOUT_TEMPLATES.map((layout) => [layout.id, layout]),
) as Record<string, GridLayoutTemplate>;

export function getGridLayout(layoutId: string): GridLayoutTemplate {
  return GRID_LAYOUT_MAP[layoutId] ?? GRID_LAYOUT_MAP[DEFAULT_GRID_LAYOUT_ID];
}

export function getDefaultLayoutIdForType(type: WorkoutType): string {
  const match = GRID_LAYOUT_TEMPLATES.find((layout) =>
    layout.defaultForTypes?.includes(type),
  );
  return match?.id ?? DEFAULT_GRID_LAYOUT_ID;
}

export function resolveWorkoutLayoutId(
  type: WorkoutType,
  layoutId?: string,
): string {
  if (layoutId && GRID_LAYOUT_MAP[layoutId]) {
    return layoutId;
  }

  return getDefaultLayoutIdForType(type);
}

export function createEmptyFields(layoutId: string): Record<string, string> {
  const layout = getGridLayout(layoutId);
  return Object.fromEntries(layout.columns.map((column) => [column.id, ""]));
}

function columnWidthToCss(width: GridColumnWidth): string {
  if (width === "narrow") {
    return "minmax(2.75rem, 3rem)";
  }

  if (width === "medium") {
    return "minmax(3.5rem, 4rem)";
  }

  return "minmax(0, 1fr)";
}

export function getGridTemplateColumns(layoutId: string): string {
  const layout = getGridLayout(layoutId);
  return layout.columns.map((column) => columnWidthToCss(column.width)).join(" ");
}

export function seedSubtaskFields(
  legacyName: string,
  layoutId: string,
): Record<string, string> {
  const fields = createEmptyFields(layoutId);
  const trimmed = legacyName.trim();

  if (!trimmed) {
    return fields;
  }

  if (layoutId === "single-line") {
    fields.line = trimmed;
    return fields;
  }

  if (layoutId === "hybrid-reps-first") {
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (match) {
      fields.reps = match[1];
      fields.workoutName = match[2].trim();
      return fields;
    }

    fields.workoutName = trimmed;
    return fields;
  }

  if (layoutId === "resistance-sets") {
    const match = trimmed.match(/^(.+?)\s[-–—]\s+(.+)$/);
    if (match) {
      fields.workoutName = match[1].trim();
      const values = match[2]
        .split("-")
        .map((value) => value.trim())
        .filter(Boolean);
      fields.set1 = values[0] ?? "";
      fields.set2 = values[1] ?? "";
      fields.set3 = values[2] ?? "";
      return fields;
    }

    fields.workoutName = trimmed;
    return fields;
  }

  const tabParts = trimmed.split("\t");
  if (tabParts.length >= 2) {
    fields.workoutName = tabParts[0] ?? "";
    fields.description = tabParts[1] ?? "";
    fields.weight = tabParts[2] ?? "";
    return fields;
  }

  const resistanceMatch = trimmed.match(/^(.+?)\s[-–—]\s+(.+)$/);
  if (resistanceMatch) {
    fields.workoutName = resistanceMatch[1].trim();
    fields.description = resistanceMatch[2].trim();
    return fields;
  }

  fields.workoutName = trimmed;
  return fields;
}

export function formatSubtaskName(
  fields: Record<string, string>,
  layoutId: string,
): string {
  const layout = getGridLayout(layoutId);

  if (layoutId === "single-line") {
    return fields.line?.trim() ?? "";
  }

  if (layoutId === "hybrid-reps-first") {
    const reps = fields.reps?.trim() ?? "";
    const workoutName = fields.workoutName?.trim() ?? "";
    if (!reps && !workoutName) {
      return "";
    }
    if (!reps) {
      return workoutName;
    }
    if (!workoutName) {
      return reps;
    }
    return `${reps} ${workoutName}`;
  }

  if (layoutId === "resistance-sets") {
    const workoutName = fields.workoutName?.trim() ?? "";
    const sets = [fields.set1, fields.set2, fields.set3]
      .map((value) => value?.trim() ?? "")
      .filter(Boolean);

    if (!workoutName && sets.length === 0) {
      return "";
    }
    if (sets.length === 0) {
      return workoutName;
    }
    return `${workoutName} - ${sets.join("-")}`;
  }

  const workoutName = fields.workoutName?.trim() ?? "";
  const description = fields.description?.trim() ?? "";
  const weight = fields.weight?.trim() ?? "";

  if (!workoutName && !description && !weight) {
    return "";
  }

  if (!description && !weight) {
    return workoutName;
  }

  return [workoutName, description, weight].join("\t");
}

export function normalizeSubtaskFields(
  rawFields: unknown,
  layoutId: string,
): Record<string, string> {
  const fields = createEmptyFields(layoutId);

  if (!rawFields || typeof rawFields !== "object") {
    return fields;
  }

  for (const column of getGridLayout(layoutId).columns) {
    const value = (rawFields as Record<string, unknown>)[column.id];
    fields[column.id] = typeof value === "string" ? value : "";
  }

  return fields;
}

export function migrateSubtaskFields(
  fields: Record<string, string>,
  fromLayoutId: string,
  toLayoutId: string,
): Record<string, string> {
  if (fromLayoutId === toLayoutId) {
    return fields;
  }

  const legacyName = formatSubtaskName(fields, fromLayoutId);
  return seedSubtaskFields(legacyName, toLayoutId);
}

export function getColumnInputMode(
  kind: GridColumnKind,
): "text" | "numeric" | "decimal" {
  if (kind === "weight") {
    return "decimal";
  }

  if (kind === "number" || kind === "reps") {
    return "numeric";
  }

  return "text";
}

export function getLayoutPreviewColumns(layoutId: string): string[] {
  return getGridLayout(layoutId).columns.map((column) => column.label);
}

export function buildWorkoutSubtask(
  layoutId: string,
  seed?: { name?: string; fields?: Record<string, string> },
): { name: string; fields: Record<string, string> } {
  const fields = seed?.fields
    ? normalizeSubtaskFields(seed.fields, layoutId)
    : seedSubtaskFields(seed?.name ?? "", layoutId);

  return {
    fields,
    name: formatSubtaskName(fields, layoutId),
  };
}
