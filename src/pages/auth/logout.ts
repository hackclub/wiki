import { clearSessionCookie } from "../../lib/auth";

export const prerender = false;

export async function GET() {
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
