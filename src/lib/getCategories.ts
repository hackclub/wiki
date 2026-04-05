import type { CollectionEntry } from "astro:content";

export type CategoryMap = Record<string, CollectionEntry<"wiki">[]>;

export function getCategories(pages: CollectionEntry<"wiki">[]): CategoryMap {
  const map: CategoryMap = {};

  for (const page of pages) {
    for (const cat of page.data.categories) {
      if (!map[cat]) map[cat] = [];
      map[cat].push(page);
    }
  }

  // Sort pages within each category alphabetically
  for (const cat in map) {
    map[cat].sort((a, b) =>
      a.data.title.localeCompare(b.data.title, "en", { sensitivity: "base" }),
    );
  }

  return map;
}

export function categorySlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function categoryFromSlug(
  slug: string,
  categories: CategoryMap,
): string | undefined {
  return Object.keys(categories).find(
    (k) => k.toLowerCase().replace(/\s+/g, "-") === slug,
  );
}
