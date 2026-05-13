import { getSessionFromCookie } from "../../../lib/auth";
import {
  deleteBlogPost,
  publishBlogPost,
  saveBlogDraft,
  unpublishBlogPost,
} from "../../../lib/db";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getPostId(params: Record<string, string | undefined>) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getPayload(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function PATCH({ request, params }) {
  const session = getSessionFromCookie(request.headers.get("cookie"));
  if (!session) {
    return json({ error: "You must be signed in to manage blogs." }, 401);
  }

  const postId = getPostId(params);
  if (!postId) return json({ error: "Invalid blog post." }, 400);

  const payload = await getPayload(request);
  const action = typeof payload.action === "string" ? payload.action : "save";

  try {
    if (action === "publish") {
      const post = await publishBlogPost(session.sub, postId);
      return post ? json({ post }) : json({ error: "Blog post not found." }, 404);
    }

    if (action === "unpublish") {
      const post = await unpublishBlogPost(session.sub, postId);
      return post ? json({ post }) : json({ error: "Blog post not found." }, 404);
    }

    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const body = typeof payload.body === "string" ? payload.body.trim() : "";
    const excerpt =
      typeof payload.excerpt === "string" ? payload.excerpt.trim() : undefined;

    if (!title || !body) {
      return json({ error: "Title and body are required." }, 400);
    }

    const post = await saveBlogDraft({
      authorSub: session.sub,
      postId,
      title,
      body,
      excerpt,
    });
    return post ? json({ post }) : json({ error: "Blog post not found." }, 404);
  } catch (error) {
    console.error("Failed to update blog post:", error);
    return json({ error: "Failed to update blog post." }, 500);
  }
}

export async function DELETE({ request, params }) {
  const session = getSessionFromCookie(request.headers.get("cookie"));
  if (!session) {
    return json({ error: "You must be signed in to manage blogs." }, 401);
  }

  const postId = getPostId(params);
  if (!postId) return json({ error: "Invalid blog post." }, 400);

  try {
    const deleted = await deleteBlogPost(session.sub, postId);
    return deleted ? json({ ok: true }) : json({ error: "Blog post not found." }, 404);
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return json({ error: "Failed to delete blog post." }, 500);
  }
}
