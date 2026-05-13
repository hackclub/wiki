import {
  buildSessionFromIdToken,
  clearReturnToCookie,
  createSessionCookie,
  exchangeCodeForToken,
  fetchAuthUserInfo,
  getSafeReturnTo,
  parseCookies,
} from "../../lib/auth";
import { saveUserProfile } from "../../lib/db";

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing authorization code.", { status: 400 });
  }

  try {
    const tokenData = await exchangeCodeForToken(code, request.url);
    const idToken = String(tokenData.id_token);
    const expiresIn = Number(tokenData.expires_in ?? 15778800);
    const accessToken =
      typeof tokenData.access_token === "string" ? tokenData.access_token : "";
    let userInfo: Record<string, unknown> | undefined;

    if (accessToken) {
      try {
        userInfo = await fetchAuthUserInfo(accessToken);
      } catch (error) {
        console.error("Failed to fetch Hack Club Auth user info:", error);
      }
    }

    const session = buildSessionFromIdToken(idToken, expiresIn, userInfo);
    const cookie = createSessionCookie(session);
    const cookies = parseCookies(request.headers.get("cookie"));
    const returnTo = getSafeReturnTo(cookies.hc_wiki_return_to ?? null);
    const headers = new Headers({ Location: returnTo });
    headers.append("Set-Cookie", cookie);
    headers.append("Set-Cookie", clearReturnToCookie());

    try {
      await saveUserProfile(session);
    } catch (error) {
      console.error("Failed to save user profile:", error);
    }

    return new Response(null, {
      status: 303,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown auth error.";
    return new Response(`Authentication failed: ${message}`, { status: 500 });
  }
}
