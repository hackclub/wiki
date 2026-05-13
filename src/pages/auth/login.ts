import {
  createReturnToCookie,
  getAuthRedirectUrl,
  getSafeReturnTo,
} from "../../lib/auth";

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const returnTo = getSafeReturnTo(url.searchParams.get("returnTo"));
  const redirectUrl = getAuthRedirectUrl(request.url);
  const headers = new Headers({ Location: redirectUrl });

  if (returnTo !== "/") {
    headers.append("Set-Cookie", createReturnToCookie(returnTo));
  }

  return new Response(null, {
    status: 302,
    headers,
  });
}
