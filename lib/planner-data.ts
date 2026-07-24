import {
  parseFocusListItems,
  type FocusListItem,
} from "@/lib/focus-list";

export interface SubTask {
  id: string;
  name: string;
  completed: boolean;
}

export interface TopPriority {
  id: string;
  name: string;
  completed: boolean;
  subtasks: SubTask[];
}

export interface PlannerData {
  topPriorities: TopPriority[];
  brainDump: string;
  focusList: FocusListItem[];
  lastSaved?: string;
}

export interface LegacyPlannerData {
  priorities?: string[];
  priorityCompleted?: boolean[];
  brainDump?: string;
  lastSaved?: string;
}

export function getDefaultData(): PlannerData {
  return {
    topPriorities: [],
    brainDump: "",
    focusList: [],
  };
}

export function migrateFromLegacy(legacy: LegacyPlannerData): TopPriority[] {
  if (!legacy.priorities || !Array.isArray(legacy.priorities)) {
    return [];
  }

  const migrated: TopPriority[] = [];

  for (const name of legacy.priorities) {
    if (name && name.trim() !== "") {
      migrated.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        completed: false,
        subtasks: [] as SubTask[],
      });
    }
  }

  return migrated;
}

export function ensurePriorityFields(
  priority: Partial<TopPriority> & { id: string; name: string }
): TopPriority {
  return {
    id: priority.id,
    name: priority.name,
    completed: priority.completed ?? false,
    subtasks: priority.subtasks ?? [],
  };
}

export function hydratePlannerData(raw: unknown): PlannerData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const parsed = raw as PlannerData & LegacyPlannerData;
  const defaultData = getDefaultData();

  const isLegacyFormat =
    Array.isArray(parsed.priorities) &&
    (parsed.priorities.length === 0 || typeof parsed.priorities[0] === "string");

  let topPriorities: TopPriority[];

  if (isLegacyFormat) {
    topPriorities = migrateFromLegacy(parsed);
  } else if (Array.isArray(parsed.topPriorities)) {
    topPriorities = parsed.topPriorities.slice(0, 3).map(ensurePriorityFields);
  } else {
    topPriorities = [];
  }

  return {
    ...defaultData,
    brainDump: parsed.brainDump || defaultData.brainDump,
    topPriorities,
    focusList: parseFocusListItems(parsed.focusList),
    lastSaved: parsed.lastSaved,
  };
}
