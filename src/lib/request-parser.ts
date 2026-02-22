export function extractAsks(input: string): string[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const asks: string[] = [];

  for (const line of lines) {
    const split = line
      .split(/(?:\s*;\s*|\s*\.\s+(?=[A-Z0-9\-]))/)
      .map((part) => part.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter(Boolean);

    for (const part of split) {
      asks.push(part);
    }
  }

  return Array.from(new Set(asks));
}
