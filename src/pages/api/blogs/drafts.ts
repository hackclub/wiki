import { getSessionFromCookie } from "../../../lib/auth";
import { getBlogPostsForAuthor, saveBlogDraft } from "../../../lib/db";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST({ request }) {
  const session = getSessionFromCookie(request.headers.get("cookie"));
  if (!session) {
    return json({ error: "You must be signed in to write a blog." }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  const excerpt =
    typeof payload.excerpt === "string" ? payload.excerpt.trim() : undefined;

  if (!title || !body) {
    return json({ error: "Title and body are required." }, 400);
  }

  try {
    const draft = await saveBlogDraft({
      authorSub: session.sub,
      title,
      body,
      excerpt,
    });
    return json({ draft }, 201);
  } catch (error) {
    console.error("Failed to save blog draft:", error);
    return json({ error: "Failed to save draft." }, 500);
  }
}

export async function GET({ request }) {
  const session = getSessionFromCookie(request.headers.get("cookie"));
  if (!session) {
    return json({ error: "You must be signed in to view drafts." }, 401);
  }

  try {
    const posts = await getBlogPostsForAuthor(session.sub);
    return json({ posts });
  } catch (error) {
    console.error("Failed to load blog drafts:", error);
    return json({ error: "Failed to load drafts." }, 500);
  }
}
