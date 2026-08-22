export function reorderIds(
  ids: number[],
  activeId: number,
  overId: number,
): number[] {
  if (activeId === overId) {
    return ids;
  }

  const oldIndex = ids.indexOf(activeId);
  const newIndex = ids.indexOf(overId);

  if (oldIndex === -1 || newIndex === -1) {
    return ids;
  }

  const next = [...ids];
  const [removed] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, removed);
  return next;
}
