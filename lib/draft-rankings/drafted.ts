export function toggleDraftedId(
  draftedIds: number[],
  playerId: number
): number[] {
  if (draftedIds.includes(playerId)) {
    return draftedIds.filter((id) => id !== playerId);
  }

  return [...draftedIds, playerId];
}

export function repairDraftedIds(
  draftedIds: number[],
  knownIds: ReadonlySet<number>
): number[] {
  const seen = new Set<number>();
  const repaired: number[] = [];

  for (const id of draftedIds) {
    if (!knownIds.has(id) || seen.has(id)) {
      continue;
    }

    seen.add(id);
    repaired.push(id);
  }

  return repaired;
}
