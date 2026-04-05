import type { CollectionEntry } from "astro:content";

export function getAllPagesSorted(
  pages: CollectionEntry<"wiki">[],
): CollectionEntry<"wiki">[] {
  return [...pages].sort((a, b) =>
    a.data.title.localeCompare(b.data.title, "en", { sensitivity: "base" }),
  );
}

export function getAlphabeticalGroups(
  pages: CollectionEntry<"wiki">[],
): Record<string, CollectionEntry<"wiki">[]> {
  const sorted = getAllPagesSorted(pages);
  const groups: Record<string, CollectionEntry<"wiki">[]> = {};

  for (const page of sorted) {
    const letter = page.data.title[0].toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    if (!groups[key]) groups[key] = [];
    groups[key].push(page);
  }

  return groups;
}
