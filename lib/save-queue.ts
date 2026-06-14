// A per-key serial write queue.
//
// Autosave/flush/clear all issue full-document writes for the same logical
// record (a planner day, a workout day, ...). Without serialization, two
// writes for the same key can be in flight simultaneously and the server's
// last-write-wins upsert lets an OLDER request that happens to land later
// silently clobber a newer one (lost update). Chaining writes per key
// guarantees they commit in submission order, so the most recently submitted
// snapshot is always the final state.

type Tail = Promise<void>;

const tails = new Map<string, Tail>();

/**
 * Enqueue a write for `key`. The task runs only after every previously
 * enqueued write for the same key has settled, guaranteeing in-order commits.
 * The returned promise mirrors the task's own result/rejection so callers can
 * await success or handle errors, while the internal chain swallows rejections
 * so one failed write never blocks later ones.
 */
export function enqueueWrite<T>(
  key: string,
  task: () => Promise<T>
): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();

  const result = previous.then(task, task);

  const tail = result.then(
    () => {},
    () => {}
  );
  tails.set(key, tail);

  void tail.then(() => {
    if (tails.get(key) === tail) {
      tails.delete(key);
    }
  });

  return result;
}

/**
 * Resolves once all writes currently queued for `key` have settled. Loads use
 * this to avoid reading the server before a pending write has committed.
 * Returns undefined when nothing is in flight. Never rejects.
 */
export function waitForWrites(key: string): Promise<void> | undefined {
  return tails.get(key);
}

/**
 * Drop tracked write tails whose key does not start with `prefix`. Used when
 * the active identity changes (sign-in/out) so stale entries for other
 * identities are forgotten. In-flight requests are not aborted; this only
 * stops future loads from waiting on writes that belong to a different
 * identity.
 */
export function purgeWritesExcept(prefix: string): void {
  for (const key of tails.keys()) {
    if (!key.startsWith(prefix)) {
      tails.delete(key);
    }
  }
}
