import { execSync } from "child_process";

export interface WikiChange {
  hash: string;
  author: string;
  date: string;
  relativeDate: string;
  message: string;
  files: string[];
}

export function getRecentChanges(limit = 50): WikiChange[] {
  try {
    const raw = execSync(
      `git log --pretty=format:"COMMIT|%H|%an|%ai|%ar|%s" --name-only -n ${limit} -- src/content/wiki/`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    ).trim();

    if (!raw) return [];

    const commits: WikiChange[] = [];
    const blocks = raw.split(/\n(?=COMMIT\|)/);

    for (const block of blocks) {
      const lines = block.trim().split("\n");
      const meta = lines[0];
      if (!meta.startsWith("COMMIT|")) continue;

      const [, hash, author, date, relativeDate, ...messageParts] =
        meta.split("|");
      const message = messageParts.join("|");
      const files = lines
        .slice(1)
        .map((f) => f.trim())
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace("src/content/wiki/", "").replace(".md", ""));

      if (files.length === 0) continue;

      commits.push({ hash, author, date, relativeDate, message, files });
    }

    return commits;
  } catch {
    return [];
  }
}
