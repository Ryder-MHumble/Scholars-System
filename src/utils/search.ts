export function searchFilter<T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string,
): T[] {
  if (!query.trim()) return items;
  const lowerQuery = query.toLowerCase().trim();
  return items.filter((item) => {
    const text = getSearchableText(item).toLowerCase();
    return text.includes(lowerQuery);
  });
}

export function highlightMatch(text: string, query: string): { text: string; highlighted: boolean }[] {
  if (!query.trim()) return [{ text, highlighted: false }];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return [{ text, highlighted: false }];
  return [
    { text: text.slice(0, index), highlighted: false },
    { text: text.slice(index, index + query.length), highlighted: true },
    { text: text.slice(index + query.length), highlighted: false },
  ].filter((s) => s.text.length > 0);
}
