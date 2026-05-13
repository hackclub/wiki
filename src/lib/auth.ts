import crypto from "crypto";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function getAuthClientId() {
  return getRequiredEnv("AUTH_CLIENT_ID");
}

function getAuthClientSecret() {
  return getRequiredEnv("AUTH_CLIENT_SECRET");
}

function getAuthSessionSecret() {
  return getRequiredEnv("AUTH_SESSION_SECRET");
}

export interface AuthSession {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  slackId?: string;
  expires_at: number;
}

function base64urlEncode(value: string) {
  return Buffer.from(value, "utf-8").toString("base64url");
}

function base64urlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf-8");
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", getAuthSessionSecret())
    .update(value)
    .digest("base64url");
}

function getAuthCookieDomain() {
  return process.env.AUTH_COOKIE_DOMAIN?.trim() || "";
}

function getCookieBaseAttributes() {
  const domain = getAuthCookieDomain();
  const domainAttribute = domain ? `; Domain=${domain}` : "";
  return `Path=/; HttpOnly; SameSite=Lax${domainAttribute}`;
}

function getAuthRedirectUri(requestUrl?: string) {
  if (requestUrl) {
    try {
      const origin = new URL(requestUrl).origin;
      return `${origin}/auth/callback`;
    } catch {
      // Ignore invalid request URL and fall back to configured redirect URI.
    }
  }
  return getRequiredEnv("AUTH_REDIRECT_URI");
}

export function getAuthRedirectUrl(requestUrl?: string) {
  const redirectUri = getAuthRedirectUri(requestUrl);
  const url = new URL("https://auth.hackclub.com/oauth/authorize");
  url.searchParams.set("client_id", getAuthClientId());
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email name slack_id");
  return url.toString();
}

export async function exchangeCodeForToken(code: string, requestUrl?: string) {
  const redirectUri = getAuthRedirectUri(requestUrl);
  const response = await fetch("https://auth.hackclub.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: getAuthClientId(),
      client_secret: getAuthClientSecret(),
      redirect_uri: redirectUri,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function fetchAuthUserInfo(accessToken: string) {
  const response = await fetch("https://auth.hackclub.com/api/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`User info request failed: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

export function createSessionCookie(session: AuthSession) {
  const payload = JSON.stringify(session);
  const encoded = base64urlEncode(payload);
  const signature = sign(encoded);
  const maxAge = Math.max(0, session.expires_at - Math.floor(Date.now() / 1000));
  return `hc_wiki_session=${encoded}.${signature}; ${getCookieBaseAttributes()}; Max-Age=${maxAge};`;
}

export function clearSessionCookie() {
  return `hc_wiki_session=; ${getCookieBaseAttributes()}; Max-Age=0;`;
}

export function getSafeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function createReturnToCookie(returnTo: string) {
  return `hc_wiki_return_to=${encodeURIComponent(getSafeReturnTo(returnTo))}; ${getCookieBaseAttributes()}; Max-Age=600;`;
}

export function clearReturnToCookie() {
  return `hc_wiki_return_to=; ${getCookieBaseAttributes()}; Max-Age=0;`;
}

export function parseCookies(cookieHeader: string | null) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (!name) continue;
    cookies[name] = decodeURIComponent(rest.join("=").trim());
  }
  return cookies;
}

export function getSessionFromCookie(cookieHeader: string | null) {
  const cookies = parseCookies(cookieHeader);
  const raw = cookies.hc_wiki_session;
  if (!raw) return null;
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;
  if (sign(encoded) !== signature) return null;

  try {
    const payload = base64urlDecode(encoded);
    const session = JSON.parse(payload) as AuthSession;
    if (session.expires_at < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function decodeIdToken(idToken: string) {
  const parts = idToken.split(".");
  if (parts.length < 2) {
    throw new Error("Invalid ID token");
  }
  const payloadJson = base64urlDecode(parts[1]);
  return JSON.parse(payloadJson) as Record<string, unknown>;
}

function getSlackIdFromClaims(claims: Record<string, unknown>) {
  return (
    typeof claims.slack_id === "string" && claims.slack_id.trim()
      ? claims.slack_id.trim()
      : typeof claims.slackId === "string" && claims.slackId.trim()
      ? claims.slackId.trim()
      : typeof claims.slack === "string" && claims.slack.trim()
      ? claims.slack.trim()
      : undefined
  );
}

function getIdentityClaims(userInfo?: Record<string, unknown>) {
  const identity = userInfo?.identity;
  return identity && typeof identity === "object"
    ? (identity as Record<string, unknown>)
    : {};
}

export function getSlackAvatarUrl(slackId?: string) {
  if (!slackId) return undefined;
  return `https://cachet.dunkirk.sh/users/${encodeURIComponent(slackId)}/r`;
}

export function buildSessionFromIdToken(
  idToken: string,
  expiresIn: number,
  userInfo?: Record<string, unknown>,
) {
  const claims = decodeIdToken(idToken);
  const identity = getIdentityClaims(userInfo);
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: String(claims.sub ?? identity.id ?? ""),
    name:
      typeof claims.name === "string"
        ? claims.name
        : typeof identity.first_name === "string" &&
            typeof identity.last_name === "string"
          ? `${identity.first_name} ${identity.last_name}`.trim()
          : typeof identity.first_name === "string"
            ? identity.first_name
            : undefined,
    email:
      typeof claims.email === "string"
        ? claims.email
        : typeof identity.primary_email === "string"
          ? identity.primary_email
          : undefined,
    picture: typeof claims.picture === "string" ? claims.picture : undefined,
    slackId: getSlackIdFromClaims({ ...claims, ...identity }),
    expires_at: now + Number(expiresIn ?? 15778800),
  };
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string) {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}

export function isAdminSession(session: AuthSession | null) {
  return session ? isAdminEmail(session.email) : false;
}

export function getAdminHost() {
  return process.env.ADMIN_HOST?.trim() || "admin.wiki.hackclub.com";
}
