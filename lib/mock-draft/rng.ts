export type Rng = () => number;

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value =
      (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export function pickIndexWeighted(weights: number[], rng: Rng): number {
  const total = weights.reduce((sum, weight) => {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new RangeError("Weights must be finite, non-negative numbers");
    }

    return sum + weight;
  }, 0);

  if (weights.length === 0 || total <= 0) {
    throw new RangeError("At least one positive weight is required");
  }

  const target = rng() * total;
  let cumulative = 0;

  for (let index = 0; index < weights.length; index += 1) {
    cumulative += weights[index];
    if (target < cumulative) {
      return index;
    }
  }

  return weights.length - 1;
}
