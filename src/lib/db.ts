import { config as dotenvConfig } from "dotenv";
import { Pool } from "pg";

dotenvConfig();

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function getDatabaseUrl() {
  return getRequiredEnv("DATABASE_URL");
}

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: getDatabaseUrl() });
  }
  return pool;
}

let usersTableInitialized = false;
let blogPostsTableInitialized = false;

export interface SavedUserProfile {
  sub: string;
  name?: string;
  email?: string;
  slackId?: string;
  picture?: string;
}

export interface CachetUserProfile {
  id?: string;
  userId?: string;
  displayName?: string;
  pronouns?: string;
  imageUrl?: string;
}

export interface BlogDraftInput {
  authorSub: string;
  title: string;
  body: string;
  excerpt?: string;
}

export interface BlogPostInput {
  authorSub: string;
  postId?: number;
  title: string;
  body: string;
  excerpt?: string;
}

function getCachetBaseUrl() {
  return process.env.CACHET_BASE_URL?.trim() || "https://cachet.dunkirk.sh";
}

function getSlackAvatarRedirectUrl(slackId?: string) {
  if (!slackId) return undefined;
  return `${getCachetBaseUrl()}/users/${encodeURIComponent(slackId)}/r`;
}

async function getCachetUserProfile(slackId?: string) {
  if (!slackId) return null;

  try {
    const response = await fetch(
      `${getCachetBaseUrl()}/users/${encodeURIComponent(slackId)}`,
    );

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Cachet returned ${response.status}`);
    }

    return (await response.json()) as CachetUserProfile;
  } catch (error) {
    console.error("Failed to fetch Cachet user profile:", error);
    return null;
  }
}

async function ensureUsersTable() {
  if (usersTableInitialized) return;
  const client = getPool();
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      auth_sub TEXT UNIQUE NOT NULL,
      email TEXT,
      name TEXT,
      slack_id TEXT,
      picture TEXT,
      slack_display_name TEXT,
      slack_pronouns TEXT,
      slack_image_url TEXT,
      last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS slack_display_name TEXT,
      ADD COLUMN IF NOT EXISTS slack_pronouns TEXT,
      ADD COLUMN IF NOT EXISTS slack_image_url TEXT;
  `);
  usersTableInitialized = true;
}

export async function query<T = any>(text: string, params?: unknown[]) {
  const result = await getPool().query<T>(text, params);
  return result;
}

export async function saveUserProfile(session: SavedUserProfile) {
  await ensureUsersTable();
  const cachetProfile = await getCachetUserProfile(session.slackId);
  const slackImageUrl =
    cachetProfile?.imageUrl || getSlackAvatarRedirectUrl(session.slackId);

  await getPool().query(
    `INSERT INTO users (
       auth_sub,
       email,
       name,
       slack_id,
       picture,
       slack_display_name,
       slack_pronouns,
       slack_image_url,
       last_seen,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     ON CONFLICT (auth_sub) DO UPDATE SET
       email = EXCLUDED.email,
       name = EXCLUDED.name,
       slack_id = EXCLUDED.slack_id,
       picture = EXCLUDED.picture,
       slack_display_name = EXCLUDED.slack_display_name,
       slack_pronouns = EXCLUDED.slack_pronouns,
       slack_image_url = EXCLUDED.slack_image_url,
       last_seen = NOW(),
       updated_at = NOW();`,
    [
      session.sub,
      session.email,
      session.name,
      session.slackId,
      session.picture,
      cachetProfile?.displayName,
      cachetProfile?.pronouns,
      slackImageUrl,
    ],
  );
}

export async function getUserByAuthSub(authSub: string) {
  await ensureUsersTable();
  const result = await getPool().query(`SELECT * FROM users WHERE auth_sub = $1`, [
    authSub,
  ]);
  return result.rows[0] ?? null;
}

export async function getUserBySlackId(slackId: string) {
  await ensureUsersTable();
  const result = await getPool().query(`SELECT * FROM users WHERE slack_id = $1`, [
    slackId,
  ]);
  return result.rows[0] ?? null;
}

async function ensureBlogPostsTable() {
  if (blogPostsTableInitialized) return;
  await ensureUsersTable();
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      author_auth_sub TEXT NOT NULL REFERENCES users(auth_sub) ON DELETE CASCADE,
      slug TEXT UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      published_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await getPool().query(`
    ALTER TABLE blog_posts
      ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS excerpt TEXT,
      ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
  `);
  blogPostsTableInitialized = true;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "post";
}

async function getUniqueBlogSlug(title: string, postId?: number) {
  const base = slugify(title);
  let slug = base;
  let suffix = 2;

  while (true) {
    const result = await getPool().query(
      `SELECT id FROM blog_posts WHERE slug = $1 AND ($2::integer IS NULL OR id != $2) LIMIT 1`,
      [slug, postId ?? null],
    );
    if (result.rowCount === 0) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function normalizeExcerpt(excerpt?: string) {
  const clean = excerpt?.trim();
  return clean ? clean.slice(0, 280) : null;
}

export async function saveBlogDraft({
  authorSub,
  title,
  body,
  excerpt,
  postId,
}: BlogPostInput) {
  await ensureBlogPostsTable();
  const cleanExcerpt = normalizeExcerpt(excerpt);

  if (postId) {
    const result = await getPool().query(
      `UPDATE blog_posts
       SET title = $3, excerpt = $4, body = $5, updated_at = NOW()
       WHERE id = $1 AND author_auth_sub = $2
       RETURNING id, slug, title, excerpt, body, status, created_at, published_at, updated_at;`,
      [postId, authorSub, title, cleanExcerpt, body],
    );
    return result.rows[0] ?? null;
  }

  const result = await getPool().query(
    `INSERT INTO blog_posts (author_auth_sub, title, excerpt, body, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'draft', NOW(), NOW())
     RETURNING id, slug, title, excerpt, body, status, created_at, published_at, updated_at;`,
    [authorSub, title, cleanExcerpt, body],
  );
  return result.rows[0];
}

export async function publishBlogPost(authorSub: string, postId: number) {
  await ensureBlogPostsTable();
  const existing = await getPool().query(
    `SELECT id, title, slug FROM blog_posts WHERE id = $1 AND author_auth_sub = $2`,
    [postId, authorSub],
  );
  const post = existing.rows[0];
  if (!post) return null;

  const slug = post.slug || (await getUniqueBlogSlug(post.title, post.id));
  const result = await getPool().query(
    `UPDATE blog_posts
     SET slug = $3,
       status = 'published',
       published_at = COALESCE(published_at, NOW()),
       updated_at = NOW()
     WHERE id = $1 AND author_auth_sub = $2
     RETURNING id, slug, title, excerpt, body, status, created_at, published_at, updated_at;`,
    [postId, authorSub, slug],
  );
  return result.rows[0] ?? null;
}

export async function unpublishBlogPost(authorSub: string, postId: number) {
  await ensureBlogPostsTable();
  const result = await getPool().query(
    `UPDATE blog_posts
     SET status = 'draft', updated_at = NOW()
     WHERE id = $1 AND author_auth_sub = $2
     RETURNING id, slug, title, excerpt, body, status, created_at, published_at, updated_at;`,
    [postId, authorSub],
  );
  return result.rows[0] ?? null;
}

export async function deleteBlogPost(authorSub: string, postId: number) {
  await ensureBlogPostsTable();
  const result = await getPool().query(
    `DELETE FROM blog_posts
     WHERE id = $1 AND author_auth_sub = $2
     RETURNING id;`,
    [postId, authorSub],
  );
  return result.rowCount > 0;
}

export async function getBlogPostForAuthor(authorSub: string, postId: number) {
  await ensureBlogPostsTable();
  const result = await getPool().query(
    `SELECT id, slug, title, excerpt, body, status, created_at, published_at, updated_at
     FROM blog_posts
     WHERE id = $1 AND author_auth_sub = $2`,
    [postId, authorSub],
  );
  return result.rows[0] ?? null;
}

export async function getBlogPostsForAuthor(authorSub: string) {
  await ensureBlogPostsTable();
  const result = await getPool().query(
    `SELECT id, slug, title, excerpt, status, created_at, published_at, updated_at
     FROM blog_posts
     WHERE author_auth_sub = $1
     ORDER BY updated_at DESC`,
    [authorSub],
  );
  return result.rows;
}

export async function getPublishedBlogPosts() {
  await ensureBlogPostsTable();
  const result = await getPool().query(
    `SELECT
       p.id,
       p.slug,
       p.title,
       p.excerpt,
       p.status,
       p.created_at,
       p.published_at,
       p.updated_at,
       u.name AS author_name,
       u.email AS author_email,
       u.slack_image_url AS author_avatar_url,
       u.picture AS author_picture
     FROM blog_posts p
     JOIN users u ON u.auth_sub = p.author_auth_sub
     WHERE p.status = 'published' AND p.slug IS NOT NULL
     ORDER BY p.published_at DESC NULLS LAST, p.updated_at DESC`,
  );
  return result.rows;
}

export async function getPublishedBlogPostBySlug(slug: string) {
  await ensureBlogPostsTable();
  const result = await getPool().query(
    `SELECT
       p.id,
       p.slug,
       p.title,
       p.excerpt,
       p.body,
       p.status,
       p.created_at,
       p.published_at,
       p.updated_at,
       u.name AS author_name,
       u.email AS author_email,
       u.slack_image_url AS author_avatar_url,
       u.picture AS author_picture
     FROM blog_posts p
     JOIN users u ON u.auth_sub = p.author_auth_sub
     WHERE p.slug = $1 AND p.status = 'published'
     LIMIT 1`,
    [slug],
  );
  return result.rows[0] ?? null;
}

export async function testDatabaseConnection() {
  const result = await getPool().query("SELECT 1 AS ok");
  return result.rows[0];
}
