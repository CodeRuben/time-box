const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isDateKey(value: string): boolean {
  return DATE_KEY_PATTERN.test(value);
}
