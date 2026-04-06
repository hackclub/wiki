---
title: Style Guide
description: How to write and format Hack Club Wiki articles consistently.
categories: ["Meta"]
tags: ["meta", "contributing", "style"]
banner: https://hackclub.com/stickers/hack-club-anime.png 
---

# Wiki Style Guide

This guide covers how to write and format articles for the Hack Club Wiki.

## Article Structure

Every article should have:

1. **A clear title** (H1, auto-generated from frontmatter)
2. **An intro paragraph** — one or two sentences explaining what the article is about
3. **Organized sections** with H2/H3 headings
4. **Links** to related articles using `[[WikiLink]]` syntax

## Frontmatter

Required fields:

```yaml
---
title: Article Title
description: One sentence describing the article.
categories: ["Category Name"]
---
```

Optional fields:

```yaml
tags: ["tag1", "tag2"]
related: ["other-article-slug"]
stub: true # marks article as needing expansion
featured: true # shows on homepage
lastEdited: 2024-01-15
---
```

## WikiLinks

Use `[[WikiLink]]` syntax to link to other articles:

- `[[Slack]]` → links to the Slack article
- `[[Starting a Club]]` → links to starting-a-club article
- `[[Clubs|club at your school]]` → custom link text

Broken WikiLinks (linking to non-existent articles) appear with a dashed underline. That's intentional — it's an invitation to create the article.

## Headings

- **H1**: Auto-generated from the title frontmatter — do not use in article body
- **H2**: Major sections
- **H3**: Subsections
- **H4+**: Avoid if possible

## Lists

Use bullet lists for unordered items, numbered lists for sequences:

```md
- Thing one
- Thing two

1. First step
2. Second step
```

## Tables

Use Markdown tables for structured data:

```md
| Column 1 | Column 2 |
| -------- | -------- |
| Data     | Data     |
```

## Code

Inline code: `backticks`

Code blocks with language:

```js
// JavaScript example
const greeting = "Hello, Hack Club!";
```

## Tone

- **Clear and direct** — write for a high schooler who's new to Hack Club
- **Friendly, not formal** — we say "you" not "one"
- **Active voice** — "Hack Club ships stickers" not "stickers are shipped"
- **No jargon** — or explain it when you use it

## Stubs

If an article needs more content, add `stub: true` to the frontmatter. It will show a banner inviting contributions.
