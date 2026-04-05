import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const wiki = defineCollection({
  loader: glob({ base: './src/content/wiki', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    stub: z.boolean().default(false),
    featured: z.boolean().default(false),
    lastEdited: z.coerce.date().optional(),
    image: z.string().optional(),
  }),
});

export const collections = { wiki };
