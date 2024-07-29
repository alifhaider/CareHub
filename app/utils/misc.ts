export function typedBoolean<T>(
  value: T
): value is Exclude<T, false | null | undefined | "" | 0> {
  return Boolean(value);
}

export function formatTime(time: string) {
  const t = new Date(time);

  const hours = t.getHours();
  const minutes = t.getMinutes();
  if (hours > 12) {
    return `${hours - 12}:${minutes} PM`;
  }
  return `${hours}:${minutes} AM`;
}
