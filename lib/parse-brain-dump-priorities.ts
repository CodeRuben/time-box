export interface BrainDumpPriorityCandidate {
  name: string;
  subtasks: string[];
}

export function parseBrainDumpPriorityCandidates(
  brainDump: string
): BrainDumpPriorityCandidate[] {
  const seenPriorities = new Set<string>();
  const results: BrainDumpPriorityCandidate[] = [];
  let current: BrainDumpPriorityCandidate | null = null;

  for (const line of brainDump.split(/\r?\n/)) {
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("--")) {
      const text = trimmedStart.slice(2).trim();
      if (!text || !current) {
        continue;
      }

      const subtaskKey = text.toLowerCase();
      if (current.subtasks.some((subtask) => subtask.toLowerCase() === subtaskKey)) {
        continue;
      }

      current.subtasks.push(text);
      continue;
    }

    if (!trimmedStart.startsWith("-")) {
      continue;
    }

    const text = trimmedStart.slice(1).trim();
    if (!text) {
      continue;
    }

    const priorityKey = text.toLowerCase();
    if (seenPriorities.has(priorityKey)) {
      current = null;
      continue;
    }

    seenPriorities.add(priorityKey);
    current = { name: text, subtasks: [] };
    results.push(current);
  }

  return results;
}

export function isPriorityNameTaken(
  name: string,
  existingNames: string[]
): boolean {
  const key = name.trim().toLowerCase();
  return existingNames.some((existing) => existing.trim().toLowerCase() === key);
}

export function formatBrainDumpSubtaskPreview(subtasks: string[]): string {
  if (subtasks.length === 0) {
    return "";
  }

  if (subtasks.length === 1) {
    return subtasks[0];
  }

  if (subtasks.length === 2) {
    return `${subtasks[0]}, ${subtasks[1]}`;
  }

  return `${subtasks[0]}, ${subtasks[1]} +${subtasks.length - 2} more`;
}
