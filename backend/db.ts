import { createClient, type Client } from "npm:@libsql/client/web";

// Environment variables
const TURSO_DB_URL = Deno.env.get("TURSO_DB_URL") || "";
const TURSO_DB_AUTH_TOKEN = Deno.env.get("TURSO_DB_AUTH_TOKEN") || "";

const S3_ENDPOINT = Deno.env.get("S3_ENDPOINT") || "";
const S3_ACCESS_KEY_ID = Deno.env.get("S3_ACCESS_KEY_ID") || "";
const S3_SECRET_ACCESS_KEY = Deno.env.get("S3_SECRET_ACCESS_KEY") || "";
const S3_BUCKET = Deno.env.get("S3_BUCKET") || "";
const S3_REGION = Deno.env.get("S3_REGION") || "auto";

// The root owner account defined by environment variables (protected from being edited/deleted)
const OWNER_USERNAME = (Deno.env.get("OWNER_USERNAME") || "owner").toLowerCase();

export function isEnvOwnerUsername(username: string): boolean {
  return username.toLowerCase() === OWNER_USERNAME;
}

// Database client initialization
let dbClient: Client;
if (TURSO_DB_URL) {
  console.log("Connecting to Turso LibSQL Database...");
  dbClient = createClient({
    url: TURSO_DB_URL,
    authToken: TURSO_DB_AUTH_TOKEN,
  });
} else {
  console.log("Using local SQLite database (local.db)...");
  dbClient = createClient({
    url: "file:local.db",
  });
}

// S3 Storage Setup if credentials are provided
let s3Client: any = null;
const useS3 = !!(S3_ENDPOINT && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET);

if (useS3) {
  console.log("S3-compatible storage configured. Initializing S3 client...");
  // Dynamic import of AWS SDK to avoid loading overhead when not in use
  try {
    const { S3Client } = await import("npm:@aws-sdk/client-s3");
    s3Client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  } catch (err) {
    console.error("Failed to load @aws-sdk/client-s3, falling back to local SQLite content storage:", err);
  }
}

// Interfaces & Types
export interface User {
  username: string;
  display_name: string;
  password_hash: string;
  is_admin: boolean;
  is_owner: boolean;
  join_date: string;
  is_creator: boolean;
  ai_author_name: string;
  api_token: string;
  des: string;
  avatar: string;
  created_storybook?: number; // query computed
  created_storyverse?: number; // query computed
  following?: string[]; // list of usernames followed
  followers?: string[]; // list of usernames following this user
}

export interface Storyverse {
  id: string;
  title: string;
  description: string;
  author: string; // username
  created_at: string;
  storybook_list?: Storybook[];
  comments_count?: number;
  likes_count?: number;
  thumbnail_url?: string;
  characters?: string;
}

export interface Storybook {
  id: string;
  title: string;
  description: string;
  authors: string; // Comma separated or single author
  categories: string; // Comma separated, e.g. "Fantasy, Romance"
  created_at: string;
  allow_other_author_edit: boolean;
  storyverse_id: string | null;
  chapters_count?: number;
  comments_count?: number;
  likes_count?: number;
  thumbnail_url?: string;
  characters?: string;
  ost?: string;
}

export interface Character {
  id: string;
  name: string;
  description: string; // JSON or text
  storyverse_id: string;
  author: string; // username
  created_at: string;
  comments_count?: number;
  likes_count?: number;
  thumbnail_url?: string;
  characters?: string;
}

export interface Comment {
  id: string;
  author: string; // username
  created_at: string;
  content: string;
  reply_to: string | null; // ID of another comment
  target_type: "storybook" | "storyverse" | "character";
  target_id: string;
  author_display_name?: string;
  replies?: Comment[];
}

export interface Chapter {
  id: string;
  storybook_id: string;
  chapter_number: number;
  title: string;
  content: string;
  summary: string; // AI-assistance summary parameter!
  created_at: string;
}

export interface Notification {
  id: string;
  username: string;
  sender: string;
  type: string;
  target_type: "storybook" | "storyverse" | "character";
  target_id: string;
  comment_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_display_name?: string;
  target_title?: string;
}

export interface ReadingProgress {
  username: string;
  storybook_id: string;
  chapter_number: number;
  updated_at: string;
  storybook_title?: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function clampPage(page: any, fallback = 1): number {
  const n = Math.floor(Number(page));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function clampPageSize(size: any, fallback = 12, max = 50): number {
  const n = Math.floor(Number(size));
  if (!(Number.isFinite(n) && n > 0)) return fallback;
  return Math.min(n, max);
}

// Database Migrations (Run on startup)
export async function initDb() {
  console.log("Initializing database schema...");

  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      is_owner INTEGER NOT NULL DEFAULT 0,
      join_date TEXT NOT NULL
    )
  `);

  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS storyverses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(author) REFERENCES users(username) ON DELETE CASCADE
    )
  `);

  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS storybooks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      authors TEXT NOT NULL,
      categories TEXT NOT NULL,
      created_at TEXT NOT NULL,
      allow_other_author_edit INTEGER NOT NULL DEFAULT 0,
      storyverse_id TEXT,
      FOREIGN KEY(storyverse_id) REFERENCES storyverses(id) ON DELETE SET NULL
    )
  `);

  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS shared_characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      storyverse_id TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(storyverse_id) REFERENCES storyverses(id) ON DELETE CASCADE,
      FOREIGN KEY(author) REFERENCES users(username) ON DELETE CASCADE
    )
  `);

  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      author TEXT NOT NULL,
      created_at TEXT NOT NULL,
      content TEXT NOT NULL,
      reply_to TEXT,
      target_type TEXT NOT NULL, -- 'storybook', 'storyverse', 'character'
      target_id TEXT NOT NULL,
      FOREIGN KEY(author) REFERENCES users(username) ON DELETE CASCADE
    )
  `);

  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      target_type TEXT NOT NULL, -- 'storybook', 'storyverse', 'character'
      target_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(username, target_type, target_id),
      FOREIGN KEY(username) REFERENCES users(username) ON DELETE CASCADE
    )
  `);

  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS follows (
      follower TEXT NOT NULL,
      following TEXT NOT NULL,
      PRIMARY KEY(follower, following),
      FOREIGN KEY(follower) REFERENCES users(username) ON DELETE CASCADE,
      FOREIGN KEY(following) REFERENCES users(username) ON DELETE CASCADE
    )
  `);

  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      storybook_id TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL, -- local storage if S3 not used
      summary TEXT NOT NULL DEFAULT '', -- AI summary helper parameter
      created_at TEXT NOT NULL,
      UNIQUE(storybook_id, chapter_number),
      FOREIGN KEY(storybook_id) REFERENCES storybooks(id) ON DELETE CASCADE
    )
  `);

  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS reading_progress (
      username TEXT NOT NULL,
      storybook_id TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(username, storybook_id),
      FOREIGN KEY(username) REFERENCES users(username) ON DELETE CASCADE,
      FOREIGN KEY(storybook_id) REFERENCES storybooks(id) ON DELETE CASCADE
    )
  `);

  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      sender TEXT NOT NULL,
      type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      comment_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(username) REFERENCES users(username) ON DELETE CASCADE
    )
  `);

  // Safe migrations for new columns
  const migrations = [
    "ALTER TABLE users ADD COLUMN is_creator INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN ai_author_name TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE comments ADD COLUMN author_display_name TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN api_token TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE storybooks ADD COLUMN thumbnail_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE storyverses ADD COLUMN thumbnail_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE shared_characters ADD COLUMN thumbnail_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE shared_characters RENAME COLUMN other_info TO description",
    "ALTER TABLE storybooks ADD COLUMN characters TEXT NOT NULL DEFAULT '[]'",
    "ALTER TABLE users ADD COLUMN des TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE storybooks ADD COLUMN ost TEXT NOT NULL DEFAULT '[]'"
  ];

  for (const sql of migrations) {
    try {
      await dbClient.execute(sql);
    } catch (err) {
      // Column might already exist, which is expected on subsequent runs
    }
  }

  console.log("Database schema initialized successfully.");
}

// --- S3 Helper Methods ---
async function putToS3(key: string, content: string) {
  if (!s3Client) return false;
  try {
    const { PutObjectCommand } = await import("npm:@aws-sdk/client-s3");
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: content,
        ContentType: "text/plain",
      })
    );
    return true;
  } catch (err) {
    console.error("Failed to write to S3:", err);
    return false;
  }
}

async function getFromS3(key: string): Promise<string | null> {
  if (!s3Client) return null;
  try {
    const { GetObjectCommand } = await import("npm:@aws-sdk/client-s3");
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );
    return await response.Body.transformToString();
  } catch (err) {
    console.error(`Failed to read from S3 (Key: ${key}):`, err);
    return null;
  }
}

async function deleteFromS3(key: string) {
  if (!s3Client) return false;
  try {
    const { DeleteObjectCommand } = await import("npm:@aws-sdk/client-s3");
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.error("Failed to delete from S3:", err);
    return false;
  }
}

// --- Database Operations ---

export async function executeQuery(sql: string, args: any[] = []) {
  return await dbClient.execute({ sql, args });
}

// User Helpers
export async function createUser(username: string, display_name: string, password_hash: string, is_admin = false, is_owner = false, des = "", avatar = ""): Promise<User> {
  const join_date = new Date().toISOString();
  await dbClient.execute({
    sql: `INSERT INTO users (username, display_name, password_hash, is_admin, is_owner, join_date, des, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [username.toLowerCase(), display_name, password_hash, is_admin ? 1 : 0, is_owner ? 1 : 0, join_date, des, avatar],
  });
  return { username: username.toLowerCase(), display_name, password_hash, is_admin, is_owner, join_date, is_creator: false, ai_author_name: "", api_token: "", des, avatar };
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const res = await dbClient.execute({
    sql: `SELECT * FROM users WHERE username = ?`,
    args: [username.toLowerCase()],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    username: row.username as string,
    display_name: row.display_name as string,
    password_hash: row.password_hash as string,
    is_admin: row.is_admin === 1,
    is_owner: row.is_owner === 1,
    join_date: row.join_date as string,
    is_creator: row.is_creator === 1,
    ai_author_name: (row.ai_author_name as string) || "",
    api_token: (row.api_token as string) || "",
    des: (row.des as string) || "",
    avatar: (row.avatar as string) || "",
  };
}

export async function getUsersCount(): Promise<number> {
  const res = await dbClient.execute(`SELECT COUNT(*) as count FROM users`);
  return Number(res.rows[0].count);
}

export async function getAllUsers(): Promise<User[]> {
  const res = await dbClient.execute(`SELECT * FROM users ORDER BY join_date DESC`);
  return res.rows.map(row => ({
    username: row.username as string,
    display_name: row.display_name as string,
    password_hash: row.password_hash as string,
    is_admin: row.is_admin === 1,
    is_owner: row.is_owner === 1,
    join_date: row.join_date as string,
    is_creator: row.is_creator === 1,
    ai_author_name: (row.ai_author_name as string) || "",
    api_token: (row.api_token as string) || "",
    des: (row.des as string) || "",
    avatar: (row.avatar as string) || "",
  }));
}

export async function getUsersPaginated(page = 1, pageSize = 20): Promise<PageResult<User>> {
  const pageNum = clampPage(page);
  const size = clampPageSize(pageSize, 20, 100);
  const offset = (pageNum - 1) * size;
  const countRes = await dbClient.execute(`SELECT COUNT(*) as count FROM users`);
  const total = Number(countRes.rows[0].count);
  const res = await dbClient.execute({
    sql: `SELECT * FROM users ORDER BY join_date DESC LIMIT ? OFFSET ?`,
    args: [size, offset],
  });
  const items = res.rows.map(row => ({
    username: row.username as string,
    display_name: row.display_name as string,
    password_hash: row.password_hash as string,
    is_admin: row.is_admin === 1,
    is_owner: row.is_owner === 1,
    join_date: row.join_date as string,
    is_creator: row.is_creator === 1,
    ai_author_name: (row.ai_author_name as string) || "",
    api_token: (row.api_token as string) || "",
    des: (row.des as string) || "",
    avatar: (row.avatar as string) || "",
  }));
  return { items, total, page: pageNum, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export async function searchUsers(query: string, limit = 10): Promise<any[]> {
  const pattern = `%${query.toLowerCase().trim()}%`;
  const res = await dbClient.execute({
    sql: `SELECT * FROM users WHERE LOWER(username) LIKE ? OR LOWER(display_name) LIKE ? ORDER BY join_date DESC LIMIT ?`,
    args: [pattern, pattern, limit],
  });
  // Sanitized output: no password_hash / api_token
  return res.rows.map(row => ({
    username: row.username as string,
    display_name: row.display_name as string,
    is_admin: row.is_admin === 1,
    is_owner: row.is_owner === 1,
    is_creator: row.is_creator === 1,
    ai_author_name: (row.ai_author_name as string) || "",
    des: (row.des as string) || "",
    avatar: (row.avatar as string) || "",
    join_date: row.join_date as string,
  }));
}


export async function updateUserSettings(username: string, display_name: string, is_creator: boolean, ai_author_name: string, des?: string, avatar?: string): Promise<boolean> {
  const sets: string[] = ["display_name = ?", "is_creator = ?", "ai_author_name = ?"];
  const args: any[] = [display_name, is_creator ? 1 : 0, ai_author_name];
  if (des !== undefined) { sets.push("des = ?"); args.push(des); }
  if (avatar !== undefined) { sets.push("avatar = ?"); args.push(avatar); }
  args.push(username.toLowerCase());
  const res = await dbClient.execute({
    sql: `UPDATE users SET ${sets.join(", ")} WHERE username = ?`,
    args,
  });
  return res.rowsAffected > 0;
}

export async function updateUserApiToken(username: string, api_token: string): Promise<boolean> {
  const res = await dbClient.execute({
    sql: `UPDATE users SET api_token = ? WHERE username = ?`,
    args: [api_token, username.toLowerCase()]
  });
  return res.rowsAffected > 0;
}

export async function getUserByApiToken(api_token: string): Promise<User | null> {
  if (!api_token) return null;
  const res = await dbClient.execute({
    sql: `SELECT * FROM users WHERE api_token = ?`,
    args: [api_token]
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    username: row.username as string,
    display_name: row.display_name as string,
    password_hash: row.password_hash as string,
    is_admin: row.is_admin === 1,
    is_owner: row.is_owner === 1,
    join_date: row.join_date as string,
    is_creator: row.is_creator === 1,
    ai_author_name: (row.ai_author_name as string) || "",
    api_token: (row.api_token as string) || "",
    des: (row.des as string) || "",
    avatar: (row.avatar as string) || "",
  };
}

// Update a user's admin role. The env-var owner can edit any user (including other owners)
// except themselves; admins can only edit non-owner users.
export async function updateUserRole(actor: string, username: string, is_admin: boolean): Promise<boolean> {
  const target = username.toLowerCase();
  // The env-var owner account is protected — no one (including themselves) may change it
  if (target === OWNER_USERNAME) return false;
  const targetUser = await getUserByUsername(target);
  if (!targetUser) return false;
  // Only the env-var owner may edit other owners
  if (targetUser.is_owner && actor.toLowerCase() !== OWNER_USERNAME) return false;
  const res = await dbClient.execute({
    sql: `UPDATE users SET is_admin = ? WHERE username = ?`,
    args: [is_admin ? 1 : 0, target],
  });
  return res.rowsAffected > 0;
}

// Delete a user. The env-var owner can delete any user (including other owners) except
// themselves; admins can only delete non-owner users.
export async function deleteUser(actor: string, username: string): Promise<boolean> {
  const target = username.toLowerCase();
  // The env-var owner account is protected — no one (including themselves) may delete it
  if (target === OWNER_USERNAME) return false;
  const targetUser = await getUserByUsername(target);
  if (!targetUser) return false;
  // Only the env-var owner may delete other owners
  if (targetUser.is_owner && actor.toLowerCase() !== OWNER_USERNAME) return false;
  const res = await dbClient.execute({
    sql: `DELETE FROM users WHERE username = ?`,
    args: [target],
  });
  return res.rowsAffected > 0;
}

// Follow Helpers
export async function followUser(follower: string, following: string): Promise<boolean> {
  if (follower.toLowerCase() === following.toLowerCase()) return false;
  try {
    await dbClient.execute({
      sql: `INSERT INTO follows (follower, following) VALUES (?, ?)`,
      args: [follower.toLowerCase(), following.toLowerCase()],
    });
    return true;
  } catch {
    return false; // Already followed
  }
}

export async function unfollowUser(follower: string, following: string): Promise<boolean> {
  const res = await dbClient.execute({
    sql: `DELETE FROM follows WHERE follower = ? AND following = ?`,
    args: [follower.toLowerCase(), following.toLowerCase()],
  });
  return res.rowsAffected > 0;
}

export async function getFollowers(username: string): Promise<string[]> {
  const res = await dbClient.execute({
    sql: `SELECT follower FROM follows WHERE following = ?`,
    args: [username.toLowerCase()],
  });
  return res.rows.map(r => r.follower as string);
}

export async function getFollowing(username: string): Promise<string[]> {
  const res = await dbClient.execute({
    sql: `SELECT following FROM follows WHERE follower = ?`,
    args: [username.toLowerCase()],
  });
  return res.rows.map(r => r.following as string);
}


// Storyverse Helpers
export async function createStoryverse(id: string, title: string, description: string, author: string, thumbnail_url = ""): Promise<Storyverse> {
  const created_at = new Date().toISOString();
  await dbClient.execute({
    sql: `INSERT INTO storyverses (id, title, description, author, created_at, thumbnail_url) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, title, description, author.toLowerCase(), created_at, thumbnail_url],
  });
  return { id, title, description, author: author.toLowerCase(), created_at, thumbnail_url };
}

export async function updateStoryverse(id: string, title: string, description: string, thumbnail_url?: string): Promise<boolean> {
  let res;
  if (thumbnail_url !== undefined) {
    res = await dbClient.execute({
      sql: `UPDATE storyverses SET title = ?, description = ?, thumbnail_url = ? WHERE id = ?`,
      args: [title, description, thumbnail_url, id],
    });
  } else {
    res = await dbClient.execute({
      sql: `UPDATE storyverses SET title = ?, description = ? WHERE id = ?`,
      args: [title, description, id],
    });
  }
  return res.rowsAffected > 0;
}

export async function getStoryverseById(id: string): Promise<Storyverse | null> {
  const res = await dbClient.execute({
    sql: `SELECT * FROM storyverses WHERE id = ?`,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  // Fetch stats & details
  const booksRes = await dbClient.execute({
    sql: `SELECT * FROM storybooks WHERE storyverse_id = ?`,
    args: [id],
  });
  const books = booksRes.rows.map(r => ({
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    authors: r.authors as string,
    categories: r.categories as string,
    created_at: r.created_at as string,
    allow_other_author_edit: r.allow_other_author_edit === 1,
    storyverse_id: r.storyverse_id as string | null,
  }));

  const commentsCount = await getCommentsCount("storyverse", id);
  const likesCount = await getLikesCount("storyverse", id);

  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    author: row.author as string,
    created_at: row.created_at as string,
    storybook_list: books,
    comments_count: commentsCount,
    likes_count: likesCount,
    thumbnail_url: (row.thumbnail_url as string) || "",
  };
}

async function storyversesFromRows(rows: any[]): Promise<Storyverse[]> {
  const list: Storyverse[] = [];
  for (const row of rows) {
    const commentsCount = await getCommentsCount("storyverse", row.id as string);
    const likesCount = await getLikesCount("storyverse", row.id as string);
    list.push({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      author: row.author as string,
      created_at: row.created_at as string,
      comments_count: commentsCount,
      likes_count: likesCount,
      thumbnail_url: (row.thumbnail_url as string) || "",
    });
  }
  return list;
}

export async function getAllStoryverses(): Promise<Storyverse[]> {
  const res = await dbClient.execute(`SELECT * FROM storyverses ORDER BY created_at DESC`);
  return await storyversesFromRows(res.rows);
}

export async function getStoryversesPaginated(page = 1, pageSize = 12): Promise<PageResult<Storyverse>> {
  const pageNum = clampPage(page);
  const size = clampPageSize(pageSize);
  const offset = (pageNum - 1) * size;
  const countRes = await dbClient.execute(`SELECT COUNT(*) as count FROM storyverses`);
  const total = Number(countRes.rows[0].count);
  const res = await dbClient.execute({
    sql: `SELECT * FROM storyverses ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [size, offset],
  });
  const items = await storyversesFromRows(res.rows);
  return { items, total, page: pageNum, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export async function getStoryversesByAuthorPaginated(username: string, page = 1, pageSize = 10): Promise<PageResult<Storyverse>> {
  const pageNum = clampPage(page);
  const size = clampPageSize(pageSize, 10);
  const offset = (pageNum - 1) * size;
  const countRes = await dbClient.execute({
    sql: `SELECT COUNT(*) as count FROM storyverses WHERE author = ?`,
    args: [username.toLowerCase()],
  });
  const total = Number(countRes.rows[0].count);
  const res = await dbClient.execute({
    sql: `SELECT * FROM storyverses WHERE author = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [username.toLowerCase(), size, offset],
  });
  const items = await storyversesFromRows(res.rows);
  return { items, total, page: pageNum, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export async function searchStoryverses(query: string, limit = 10): Promise<any[]> {
  const pattern = `%${query.toLowerCase().trim()}%`;
  const res = await dbClient.execute({
    sql: `
      SELECT * FROM storyverses
      WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(author) LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `,
    args: [pattern, pattern, pattern, limit],
  });
  const list: any[] = [];
  for (const row of res.rows) {
    const booksRes = await dbClient.execute({
      sql: `SELECT COUNT(*) as count FROM storybooks WHERE storyverse_id = ?`,
      args: [row.id as string],
    });
    const commentsCount = await getCommentsCount("storyverse", row.id as string);
    const likesCount = await getLikesCount("storyverse", row.id as string);
    list.push({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      author: row.author as string,
      created_at: row.created_at as string,
      storybooks_count: Number(booksRes.rows[0].count),
      comments_count: commentsCount,
      likes_count: likesCount,
      thumbnail_url: (row.thumbnail_url as string) || "",
    });
  }
  return list;
}

export async function deleteStoryverse(id: string): Promise<boolean> {
  const res = await dbClient.execute({
    sql: `DELETE FROM storyverses WHERE id = ?`,
    args: [id],
  });
  return res.rowsAffected > 0;
}

// Storybook Helpers
export async function createStorybook(
  id: string,
  title: string,
  description: string,
  authors: string,
  categories: string,
  allow_other_author_edit: boolean,
  storyverse_id: string | null,
  thumbnail_url = "",
  characters = "[]",
  ost = "[]"
): Promise<Storybook> {
  const created_at = new Date().toISOString();
  await dbClient.execute({
    sql: `INSERT INTO storybooks (id, title, description, authors, categories, created_at, allow_other_author_edit, storyverse_id, thumbnail_url, characters, ost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, title, description, authors, categories, created_at, allow_other_author_edit ? 1 : 0, storyverse_id, thumbnail_url, characters, ost],
  });
  return {
    id,
    title,
    description,
    authors,
    categories,
    created_at,
    allow_other_author_edit,
    storyverse_id,
    thumbnail_url,
    characters,
    ost,
  };
}

export async function updateStorybook(
  id: string,
  title: string,
  description: string,
  categories: string,
  allow_other_author_edit: boolean,
  storyverse_id: string | null,
  thumbnail_url?: string,
  characters?: string,
  ost?: string
): Promise<boolean> {
  const sets: string[] = [
    "title = ?",
    "description = ?",
    "categories = ?",
    "allow_other_author_edit = ?",
    "storyverse_id = ?"
  ];
  const args: any[] = [title, description, categories, allow_other_author_edit ? 1 : 0, storyverse_id];
  if (thumbnail_url !== undefined) { sets.push("thumbnail_url = ?"); args.push(thumbnail_url); }
  if (characters !== undefined) { sets.push("characters = ?"); args.push(characters); }
  if (ost !== undefined) { sets.push("ost = ?"); args.push(ost); }
  args.push(id);
  const res = await dbClient.execute({
    sql: `UPDATE storybooks SET ${sets.join(", ")} WHERE id = ?`,
    args,
  });
  return res.rowsAffected > 0;
}

export async function getStorybookById(id: string): Promise<Storybook | null> {
  const res = await dbClient.execute({
    sql: `SELECT * FROM storybooks WHERE id = ?`,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  const chaptersCountRes = await dbClient.execute({
    sql: `SELECT COUNT(*) as count FROM chapters WHERE storybook_id = ?`,
    args: [id],
  });
  const chaptersCount = Number(chaptersCountRes.rows[0].count);
  const commentsCount = await getCommentsCount("storybook", id);
  const likesCount = await getLikesCount("storybook", id);

  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    authors: row.authors as string,
    categories: row.categories as string,
    created_at: row.created_at as string,
    allow_other_author_edit: row.allow_other_author_edit === 1,
    storyverse_id: row.storyverse_id as string | null,
    chapters_count: chaptersCount,
    comments_count: commentsCount,
    likes_count: likesCount,
    thumbnail_url: (row.thumbnail_url as string) || "",
    characters: (row.characters as string) || "[]",
    ost: (row.ost as string) || "[]",
  };
}

async function storybooksFromRows(rows: any[]): Promise<Storybook[]> {
  const list: Storybook[] = [];
  for (const row of rows) {
    const chRes = await dbClient.execute({
      sql: `SELECT COUNT(*) as count FROM chapters WHERE storybook_id = ?`,
      args: [row.id as string],
    });
    const chaptersCount = Number(chRes.rows[0].count);
    const commentsCount = await getCommentsCount("storybook", row.id as string);
    const likesCount = await getLikesCount("storybook", row.id as string);
    list.push({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      authors: row.authors as string,
      categories: row.categories as string,
      created_at: row.created_at as string,
      allow_other_author_edit: row.allow_other_author_edit === 1,
      storyverse_id: row.storyverse_id as string | null,
      chapters_count: chaptersCount,
      comments_count: commentsCount,
      likes_count: likesCount,
      thumbnail_url: (row.thumbnail_url as string) || "",
      characters: (row.characters as string) || "[]",
      ost: (row.ost as string) || "[]",
    });
  }
  return list;
}

export async function getAllStorybooks(): Promise<Storybook[]> {
  const res = await dbClient.execute(`SELECT * FROM storybooks ORDER BY created_at DESC`);
  return await storybooksFromRows(res.rows);
}

export async function getStorybooksPaginated(page = 1, pageSize = 12): Promise<PageResult<Storybook>> {
  const pageNum = clampPage(page);
  const size = clampPageSize(pageSize);
  const offset = (pageNum - 1) * size;
  const countRes = await dbClient.execute(`SELECT COUNT(*) as count FROM storybooks`);
  const total = Number(countRes.rows[0].count);
  const res = await dbClient.execute({
    sql: `SELECT * FROM storybooks ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [size, offset],
  });
  const items = await storybooksFromRows(res.rows);
  return { items, total, page: pageNum, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export async function getStorybooksByAuthorPaginated(username: string, page = 1, pageSize = 10): Promise<PageResult<Storybook>> {
  const pageNum = clampPage(page);
  const size = clampPageSize(pageSize, 10);
  const offset = (pageNum - 1) * size;
  const pattern = `%${username.toLowerCase()}%`;
  const countRes = await dbClient.execute({
    sql: `SELECT COUNT(*) as count FROM storybooks WHERE LOWER(authors) LIKE ?`,
    args: [pattern],
  });
  const total = Number(countRes.rows[0].count);
  const res = await dbClient.execute({
    sql: `SELECT * FROM storybooks WHERE LOWER(authors) LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [pattern, size, offset],
  });
  const items = await storybooksFromRows(res.rows);
  return { items, total, page: pageNum, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export async function searchStorybooks(query: string, limit = 10): Promise<Storybook[]> {
  const pattern = `%${query.toLowerCase().trim()}%`;
  const res = await dbClient.execute({
    sql: `
      SELECT * FROM storybooks
      WHERE LOWER(title) LIKE ? OR LOWER(authors) LIKE ? OR LOWER(categories) LIKE ? OR LOWER(description) LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `,
    args: [pattern, pattern, pattern, pattern, limit],
  });
  const list: Storybook[] = [];
  for (const row of res.rows) {
    const chRes = await dbClient.execute({
      sql: `SELECT COUNT(*) as count FROM chapters WHERE storybook_id = ?`,
      args: [row.id as string],
    });
    const chaptersCount = Number(chRes.rows[0].count);
    const commentsCount = await getCommentsCount("storybook", row.id as string);
    const likesCount = await getLikesCount("storybook", row.id as string);
    list.push({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      authors: row.authors as string,
      categories: row.categories as string,
      created_at: row.created_at as string,
      allow_other_author_edit: row.allow_other_author_edit === 1,
      storyverse_id: row.storyverse_id as string | null,
      chapters_count: chaptersCount,
      comments_count: commentsCount,
      likes_count: likesCount,
      thumbnail_url: (row.thumbnail_url as string) || "",
      characters: (row.characters as string) || "[]",
      ost: (row.ost as string) || "[]",
    });
  }
  return list;
}

export async function deleteStorybook(id: string): Promise<boolean> {
  // First clean S3 if chapters exist in S3
  const chaptersRes = await dbClient.execute({
    sql: `SELECT chapter_number FROM chapters WHERE storybook_id = ?`,
    args: [id],
  });
  if (useS3) {
    for (const row of chaptersRes.rows) {
      const s3Key = `chapters/${id}/${row.chapter_number}.txt`;
      await deleteFromS3(s3Key);
    }
  }

  const res = await dbClient.execute({
    sql: `DELETE FROM storybooks WHERE id = ?`,
    args: [id],
  });
  return res.rowsAffected > 0;
}


// Character Helpers
export async function createCharacter(
  id: string,
  name: string,
  description: string,
  storyverse_id: string,
  author: string,
  thumbnail_url = ""
): Promise<Character> {
  const created_at = new Date().toISOString();
  await dbClient.execute({
    sql: `INSERT INTO shared_characters (id, name, description, storyverse_id, author, created_at, thumbnail_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, name, description, storyverse_id, author.toLowerCase(), created_at, thumbnail_url],
  });
  return { id, name, description, storyverse_id, author: author.toLowerCase(), created_at, thumbnail_url };
}

export async function getCharacterById(id: string): Promise<Character | null> {
  const res = await dbClient.execute({
    sql: `SELECT * FROM shared_characters WHERE id = ?`,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  const commentsCount = await getCommentsCount("character", id);
  const likesCount = await getLikesCount("character", id);

  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    storyverse_id: row.storyverse_id as string,
    author: row.author as string,
    created_at: row.created_at as string,
    comments_count: commentsCount,
    likes_count: likesCount,
    thumbnail_url: (row.thumbnail_url as string) || "",
  };
}

export async function getCharactersByStoryverse(storyverse_id: string): Promise<Character[]> {
  const res = await dbClient.execute({
    sql: `SELECT * FROM shared_characters WHERE storyverse_id = ?`,
    args: [storyverse_id],
  });
  const list: Character[] = [];
  for (const row of res.rows) {
    const commentsCount = await getCommentsCount("character", row.id as string);
    const likesCount = await getLikesCount("character", row.id as string);
    list.push({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      storyverse_id: row.storyverse_id as string,
      author: row.author as string,
      created_at: row.created_at as string,
      comments_count: commentsCount,
      likes_count: likesCount,
      thumbnail_url: (row.thumbnail_url as string) || "",
    });
  }
  return list;
}

async function charactersFromRows(rows: any[]): Promise<Character[]> {
  const list: Character[] = [];
  for (const row of rows) {
    const commentsCount = await getCommentsCount("character", row.id as string);
    const likesCount = await getLikesCount("character", row.id as string);
    list.push({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      storyverse_id: row.storyverse_id as string,
      author: row.author as string,
      created_at: row.created_at as string,
      comments_count: commentsCount,
      likes_count: likesCount,
      thumbnail_url: (row.thumbnail_url as string) || "",
    });
  }
  return list;
}

export async function getAllCharacters(): Promise<Character[]> {
  const res = await dbClient.execute(`SELECT * FROM shared_characters ORDER BY created_at DESC`);
  return await charactersFromRows(res.rows);
}

export async function getCharactersPaginated(page = 1, pageSize = 12): Promise<PageResult<Character>> {
  const pageNum = clampPage(page);
  const size = clampPageSize(pageSize);
  const offset = (pageNum - 1) * size;
  const countRes = await dbClient.execute(`SELECT COUNT(*) as count FROM shared_characters`);
  const total = Number(countRes.rows[0].count);
  const res = await dbClient.execute({
    sql: `SELECT * FROM shared_characters ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [size, offset],
  });
  const items = await charactersFromRows(res.rows);
  return { items, total, page: pageNum, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export async function getCharactersByAuthorPaginated(username: string, page = 1, pageSize = 10): Promise<PageResult<Character>> {
  const pageNum = clampPage(page);
  const size = clampPageSize(pageSize, 10);
  const offset = (pageNum - 1) * size;
  const countRes = await dbClient.execute({
    sql: `SELECT COUNT(*) as count FROM shared_characters WHERE author = ?`,
    args: [username.toLowerCase()],
  });
  const total = Number(countRes.rows[0].count);
  const res = await dbClient.execute({
    sql: `SELECT * FROM shared_characters WHERE author = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [username.toLowerCase(), size, offset],
  });
  const items = await charactersFromRows(res.rows);
  return { items, total, page: pageNum, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export async function searchCharacters(query: string, limit = 10): Promise<any[]> {
  const pattern = `%${query.toLowerCase().trim()}%`;
  const res = await dbClient.execute({
    sql: `
      SELECT * FROM shared_characters
      WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(author) LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `,
    args: [pattern, pattern, pattern, limit],
  });
  const list: any[] = [];
  for (const row of res.rows) {
    const commentsCount = await getCommentsCount("character", row.id as string);
    const likesCount = await getLikesCount("character", row.id as string);
    list.push({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      storyverse_id: row.storyverse_id as string,
      author: row.author as string,
      created_at: row.created_at as string,
      comments_count: commentsCount,
      likes_count: likesCount,
      thumbnail_url: (row.thumbnail_url as string) || "",
    });
  }
  return list;
}


export async function updateCharacter(id: string, name: string, description: string, thumbnail_url?: string): Promise<boolean> {
  let res;
  if (thumbnail_url !== undefined) {
    res = await dbClient.execute({
      sql: `UPDATE shared_characters SET name = ?, description = ?, thumbnail_url = ? WHERE id = ?`,
      args: [name, description, thumbnail_url, id],
    });
  } else {
    res = await dbClient.execute({
      sql: `UPDATE shared_characters SET name = ?, description = ? WHERE id = ?`,
      args: [name, description, id],
    });
  }
  return res.rowsAffected > 0;
}

export async function deleteCharacter(id: string): Promise<boolean> {
  const res = await dbClient.execute({
    sql: `DELETE FROM shared_characters WHERE id = ?`,
    args: [id],
  });
  return res.rowsAffected > 0;
}


// Chapter Helpers
export async function createOrEditChapter(
  storybook_id: string,
  chapter_number: number,
  title: string,
  content: string,
  summary: string // AI summary helper!
): Promise<Chapter> {
  const created_at = new Date().toISOString();
  const id = `${storybook_id}_${chapter_number}`;

  // If using S3, store content in S3 and keep an empty or shortened string in SQLite
  let dbContent = content;
  if (useS3) {
    const s3Key = `chapters/${storybook_id}/${chapter_number}.txt`;
    const s3Success = await putToS3(s3Key, content);
    if (s3Success) {
      dbContent = "[Stored in S3]";
    }
  }

  // Check if already exists
  const existRes = await dbClient.execute({
    sql: `SELECT id FROM chapters WHERE storybook_id = ? AND chapter_number = ?`,
    args: [storybook_id, chapter_number],
  });

  if (existRes.rows.length > 0) {
    await dbClient.execute({
      sql: `UPDATE chapters SET title = ?, content = ?, summary = ? WHERE storybook_id = ? AND chapter_number = ?`,
      args: [title, dbContent, summary, storybook_id, chapter_number],
    });
  } else {
    await dbClient.execute({
      sql: `INSERT INTO chapters (id, storybook_id, chapter_number, title, content, summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, storybook_id, chapter_number, title, dbContent, summary, created_at],
    });
  }

  return { id, storybook_id, chapter_number, title, content, summary, created_at };
}

export async function getChapter(storybook_id: string, chapter_number: number): Promise<Chapter | null> {
  const res = await dbClient.execute({
    sql: `SELECT * FROM chapters WHERE storybook_id = ? AND chapter_number = ?`,
    args: [storybook_id, chapter_number],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  let content = row.content as string;
  if (useS3 && content === "[Stored in S3]") {
    const s3Key = `chapters/${storybook_id}/${chapter_number}.txt`;
    const s3Content = await getFromS3(s3Key);
    if (s3Content !== null) {
      content = s3Content;
    }
  }

  return {
    id: row.id as string,
    storybook_id: row.storybook_id as string,
    chapter_number: Number(row.chapter_number),
    title: row.title as string,
    content,
    summary: (row.summary as string) || "",
    created_at: row.created_at as string,
  };
}

export async function getChaptersList(storybook_id: string): Promise<Omit<Chapter, "content">[]> {
  const res = await dbClient.execute({
    sql: `SELECT id, storybook_id, chapter_number, title, summary, created_at FROM chapters WHERE storybook_id = ? ORDER BY chapter_number ASC`,
    args: [storybook_id],
  });
  return res.rows.map(row => ({
    id: row.id as string,
    storybook_id: row.storybook_id as string,
    chapter_number: Number(row.chapter_number),
    title: row.title as string,
    summary: (row.summary as string) || "",
    created_at: row.created_at as string,
  }));
}

export async function deleteChapter(storybook_id: string, chapter_number: number): Promise<boolean> {
  if (useS3) {
    const s3Key = `chapters/${storybook_id}/${chapter_number}.txt`;
    await deleteFromS3(s3Key);
  }

  const res = await dbClient.execute({
    sql: `DELETE FROM chapters WHERE storybook_id = ? AND chapter_number = ?`,
    args: [storybook_id, chapter_number],
  });
  return res.rowsAffected > 0;
}


// Comment Helpers
export async function addComment(
  id: string,
  author: string,
  content: string,
  reply_to: string | null,
  target_type: "storybook" | "storyverse" | "character",
  target_id: string,
  author_display_name?: string
): Promise<Comment> {
  const created_at = new Date().toISOString();
  const user = await getUserByUsername(author);
  // Prefer an explicit override (e.g. the AI author name from MCP), then the user's display name
  const resolvedDisplayName = author_display_name || user?.display_name || author;

  await dbClient.execute({
    sql: `INSERT INTO comments (id, author, content, reply_to, target_type, target_id, created_at, author_display_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, author.toLowerCase(), content, reply_to, target_type, target_id, created_at, resolvedDisplayName],
  });

  return {
    id,
    author: author.toLowerCase(),
    content,
    reply_to,
    target_type,
    target_id,
    created_at,
    author_display_name: resolvedDisplayName,
  };
}

export async function getCommentsForTarget(
  target_type: "storybook" | "storyverse" | "character",
  target_id: string
): Promise<Comment[]> {
  const res = await dbClient.execute({
    sql: `
      SELECT c.*, u.display_name as user_display_name
      FROM comments c
      LEFT JOIN users u ON c.author = u.username
      WHERE c.target_type = ? AND c.target_id = ?
      ORDER BY c.created_at ASC
    `,
    args: [target_type, target_id],
  });

  const comments: Comment[] = res.rows.map(row => ({
    id: row.id as string,
    author: row.author as string,
    created_at: row.created_at as string,
    content: row.content as string,
    reply_to: row.reply_to as string | null,
    target_type: row.target_type as "storybook" | "storyverse" | "character",
    target_id: row.target_id as string,
    // Prefer the stored override (AI author name), then the user's display name
    author_display_name: (row.author_display_name as string) || (row.user_display_name as string) || (row.author as string),
    replies: [],
  }));

  // Build tree hierarchy for comments
  const commentMap = new Map<string, Comment>();
  const roots: Comment[] = [];

  for (const c of comments) {
    commentMap.set(c.id, c);
  }

  for (const c of comments) {
    if (c.reply_to && commentMap.has(c.reply_to)) {
      commentMap.get(c.reply_to)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  }

  return roots;
}

export async function getCommentsCount(
  target_type: "storybook" | "storyverse" | "character",
  target_id: string
): Promise<number> {
  const res = await dbClient.execute({
    sql: `SELECT COUNT(*) as count FROM comments WHERE target_type = ? AND target_id = ?`,
    args: [target_type, target_id],
  });
  return Number(res.rows[0].count);
}

export async function deleteComment(id: string): Promise<boolean> {
  // Recursively delete children (or they will lose parents)
  // SQLite doesn't strictly have CASCADE unless foreign keys are fully mapped, but we can do a simple cascade delete
  await dbClient.execute({
    sql: `DELETE FROM comments WHERE reply_to = ?`,
    args: [id],
  });

  const res = await dbClient.execute({
    sql: `DELETE FROM comments WHERE id = ?`,
    args: [id],
  });
  return res.rowsAffected > 0;
}


// Like Helpers
export async function toggleLike(username: string, target_type: "storybook" | "storyverse" | "character", target_id: string): Promise<{ liked: boolean }> {
  const existRes = await dbClient.execute({
    sql: `SELECT id FROM likes WHERE username = ? AND target_type = ? AND target_id = ?`,
    args: [username.toLowerCase(), target_type, target_id],
  });

  if (existRes.rows.length > 0) {
    await dbClient.execute({
      sql: `DELETE FROM likes WHERE username = ? AND target_type = ? AND target_id = ?`,
      args: [username.toLowerCase(), target_type, target_id],
    });
    return { liked: false };
  } else {
    const id = `${username}_${target_type}_${target_id}`;
    const created_at = new Date().toISOString();
    await dbClient.execute({
      sql: `INSERT INTO likes (id, username, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [id, username.toLowerCase(), target_type, target_id, created_at],
    });
    return { liked: true };
  }
}

export async function getLikesCount(
  target_type: "storybook" | "storyverse" | "character",
  target_id: string
): Promise<number> {
  const res = await dbClient.execute({
    sql: `SELECT COUNT(*) as count FROM likes WHERE target_type = ? AND target_id = ?`,
    args: [target_type, target_id],
  });
  return Number(res.rows[0].count);
}

export async function isLikedByUser(username: string, target_type: "storybook" | "storyverse" | "character", target_id: string): Promise<boolean> {
  const res = await dbClient.execute({
    sql: `SELECT id FROM likes WHERE username = ? AND target_type = ? AND target_id = ?`,
    args: [username.toLowerCase(), target_type, target_id],
  });
  return res.rows.length > 0;
}


// Reading Progress Helpers
export async function saveReadingProgress(username: string, storybook_id: string, chapter_number: number): Promise<void> {
  const updated_at = new Date().toISOString();
  const existRes = await dbClient.execute({
    sql: `SELECT chapter_number FROM reading_progress WHERE username = ? AND storybook_id = ?`,
    args: [username.toLowerCase(), storybook_id],
  });

  if (existRes.rows.length > 0) {
    await dbClient.execute({
      sql: `UPDATE reading_progress SET chapter_number = ?, updated_at = ? WHERE username = ? AND storybook_id = ?`,
      args: [chapter_number, updated_at, username.toLowerCase(), storybook_id],
    });
  } else {
    await dbClient.execute({
      sql: `INSERT INTO reading_progress (username, storybook_id, chapter_number, updated_at) VALUES (?, ?, ?, ?)`,
      args: [username.toLowerCase(), storybook_id, chapter_number, updated_at],
    });
  }
}

export async function getReadingProgress(username: string): Promise<ReadingProgress[]> {
  const res = await dbClient.execute({
    sql: `
      SELECT rp.*, sb.title as storybook_title
      FROM reading_progress rp
      LEFT JOIN storybooks sb ON rp.storybook_id = sb.id
      WHERE rp.username = ?
      ORDER BY rp.updated_at DESC
    `,
    args: [username.toLowerCase()],
  });

  return res.rows.map(row => ({
    username: row.username as string,
    storybook_id: row.storybook_id as string,
    chapter_number: Number(row.chapter_number),
    updated_at: row.updated_at as string,
    storybook_title: (row.storybook_title as string) || "Unknown Storybook",
  }));
}


// --- Notification Helpers ---

export async function createNotification(
  username: string,
  sender: string,
  type: string,
  target_type: "storybook" | "storyverse" | "character",
  target_id: string,
  comment_id: string,
  content: string
): Promise<Notification> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const created_at = new Date().toISOString();
  await dbClient.execute({
    sql: `INSERT INTO notifications (id, username, sender, type, target_type, target_id, comment_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, username.toLowerCase(), sender.toLowerCase(), type, target_type, target_id, comment_id, content, 0, created_at],
  });
  return { id, username: username.toLowerCase(), sender: sender.toLowerCase(), type, target_type, target_id, comment_id, content, is_read: false, created_at };
}

async function notificationsFromRows(rows: any[]): Promise<Notification[]> {
  const notifications: Notification[] = [];
  for (const row of rows) {
    let target_title = "Liên kết";
    const t_type = row.target_type as string;
    const t_id = row.target_id as string;
    if (t_type === "storybook") {
      const b = await getStorybookById(t_id);
      if (b) target_title = b.title;
    } else if (t_type === "storyverse") {
      const sv = await getStoryverseById(t_id);
      if (sv) target_title = sv.title;
    } else if (t_type === "character") {
      const c = await getCharacterById(t_id);
      if (c) target_title = c.name;
    }

    notifications.push({
      id: row.id as string,
      username: row.username as string,
      sender: row.sender as string,
      type: row.type as string,
      target_type: row.target_type as "storybook" | "storyverse" | "character",
      target_id: row.target_id as string,
      comment_id: row.comment_id as string,
      content: row.content as string,
      is_read: row.is_read === 1,
      created_at: row.created_at as string,
      sender_display_name: (row.sender_display_name as string) || (row.sender as string),
      target_title,
    });
  }
  return notifications;
}

export async function getNotificationsForUser(username: string): Promise<Notification[]> {
  const res = await dbClient.execute({
    sql: `
      SELECT n.*, u.display_name as sender_display_name
      FROM notifications n
      LEFT JOIN users u ON n.sender = u.username
      WHERE n.username = ?
      ORDER BY n.created_at DESC
    `,
    args: [username.toLowerCase()],
  });
  return await notificationsFromRows(res.rows);
}

export async function getNotificationsPaginated(username: string, page = 1, pageSize = 15): Promise<PageResult<Notification>> {
  const pageNum = clampPage(page);
  const size = clampPageSize(pageSize, 15);
  const offset = (pageNum - 1) * size;
  const countRes = await dbClient.execute({
    sql: `SELECT COUNT(*) as count FROM notifications WHERE username = ?`,
    args: [username.toLowerCase()],
  });
  const total = Number(countRes.rows[0].count);
  const res = await dbClient.execute({
    sql: `
      SELECT n.*, u.display_name as sender_display_name
      FROM notifications n
      LEFT JOIN users u ON n.sender = u.username
      WHERE n.username = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `,
    args: [username.toLowerCase(), size, offset],
  });
  const items = await notificationsFromRows(res.rows);
  return { items, total, page: pageNum, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const res = await dbClient.execute({
    sql: `UPDATE notifications SET is_read = 1 WHERE id = ?`,
    args: [id],
  });
  return res.rowsAffected > 0;
}

export async function getUnreadNotificationsCount(username: string): Promise<number> {
  const res = await dbClient.execute({
    sql: `SELECT COUNT(*) as count FROM notifications WHERE username = ? AND is_read = 0`,
    args: [username.toLowerCase()],
  });
  return Number(res.rows[0].count);
}


// --- Safe S3 / Base64 Thumbnail Upload Helpers ---

export async function uploadThumbnail(type: string, id: string, file: any): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);
  const contentType = file.type || "image/jpeg";

  if (useS3 && s3Client) {
    try {
      const { PutObjectCommand } = await import("npm:@aws-sdk/client-s3");
      const key = `thumbnails/${type}/${id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: fileBytes,
          ContentType: contentType,
        })
      );
      return `/api/s3-proxy?key=${encodeURIComponent(key)}`;
    } catch (err) {
      console.error("Failed to upload thumbnail to S3, falling back to base64:", err);
    }
  }

  // Fallback to base64 string safely
  let binary = "";
  const len = fileBytes.byteLength;
  const chunk = 8192;
  for (let i = 0; i < len; i += chunk) {
    const subarr = fileBytes.subarray(i, i + chunk);
    // Convert subarray to standard array to avoid max call stack size
    const arr = Array.from(subarr);
    binary += String.fromCharCode.apply(null, arr);
  }
  const base64 = btoa(binary);
  return `data:${contentType};base64,${base64}`;
}

export async function getS3Object(key: string): Promise<{ body: Uint8Array, contentType: string } | null> {
  if (!s3Client) return null;
  try {
    const { GetObjectCommand } = await import("npm:@aws-sdk/client-s3");
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );
    const body = await response.Body.transformToByteArray();
    return {
      body,
      contentType: response.ContentType || "image/jpeg",
    };
  } catch (err) {
    console.error("Failed to fetch from S3:", err);
    return null;
  }
}
