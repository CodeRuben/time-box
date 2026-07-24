export interface BrainDumpTransformResult {
  text: string;
  cursor: number;
}

interface BrainDumpTransformRule {
  trigger: string;
  replacement: string;
  /** Only match when the trigger starts at the beginning of a line. */
  lineStart?: boolean;
}

const TRANSFORM_RULES: BrainDumpTransformRule[] = [
  { trigger: "->", replacement: "→" },
  { trigger: "* ", replacement: "• ", lineStart: true },
];

function isLineStart(text: string, index: number): boolean {
  return index === 0 || text[index - 1] === "\n";
}

/**
 * Applies inline brain-dump shortcuts ending at the cursor.
 * Returns the original text/cursor when nothing matched.
 */
export function applyBrainDumpTransforms(
  text: string,
  cursor: number
): BrainDumpTransformResult {
  if (cursor < 0 || cursor > text.length) {
    return { text, cursor };
  }

  const before = text.slice(0, cursor);
  const after = text.slice(cursor);

  for (const rule of TRANSFORM_RULES) {
    if (!before.endsWith(rule.trigger)) {
      continue;
    }

    const triggerStart = cursor - rule.trigger.length;
    if (rule.lineStart && !isLineStart(text, triggerStart)) {
      continue;
    }

    const nextBefore = before.slice(0, -rule.trigger.length) + rule.replacement;
    return {
      text: nextBefore + after,
      cursor: nextBefore.length,
    };
  }

  return { text, cursor };
}
