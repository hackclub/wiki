import { getSessionFromCookie, getSlackAvatarUrl } from "../../../lib/auth";
import { getUserByAuthSub } from "../../../lib/db";

export const prerender = false;

export async function GET({ request }) {
  const session = getSessionFromCookie(request.headers.get("cookie"));
  if (!session) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let savedUser = null;
  try {
    savedUser = await getUserByAuthSub(session.sub);
  } catch (error) {
    console.error("Failed to load saved user profile:", error);
  }

  const slackId = savedUser?.slack_id ?? session.slackId;
  const picture = savedUser?.picture ?? session.picture;
  const avatarUrl =
    savedUser?.slack_image_url ?? (slackId ? getSlackAvatarUrl(slackId) : picture);

  return new Response(JSON.stringify({ user: {
      sub: session.sub,
      name: savedUser?.name ?? session.name,
      email: savedUser?.email ?? session.email,
      picture,
      slackId,
      slackDisplayName: savedUser?.slack_display_name,
      slackPronouns: savedUser?.slack_pronouns,
      avatarUrl,
    }}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
