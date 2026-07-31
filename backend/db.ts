import { createClient, type Client } from "npm:@libsql/client";

// Environment variables
const TURSO_DB_URL = Deno.env.get("TURSO_DB_URL") || "";
const TURSO_DB_AUTH_TOKEN = Deno.env.get("TURSO_DB_AUTH_TOKEN") || "";

const S3_ENDPOINT = Deno.env.get("S3_ENDPOINT") || "";
const S3_ACCESS_KEY_ID = Deno.env.get("S3_ACCESS_KEY_ID") || "";
const S3_SECRET_ACCESS_KEY = Deno.env.get("S3_SECRET_ACCESS_KEY") || "";
const S3_BUCKET = Deno.env.get("S3_BUCKET") || "";
const S3_REGION = Deno.env.get("S3_REGION") || "auto";

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
}

export interface SharedCharacter {
  id: string;
  name: string;
  other_info: string; // JSON or text
  storyverse_id: string;
  author: string; // username
  created_at: string;
  comments_count?: number;
  likes_count?: number;
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

export interface ReadingProgress {
  username: string;
  storybook_id: string;
  chapter_number: number;
  updated_at: string;
  storybook_title?: string;
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
      other_info TEXT NOT NULL,
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
export async function createUser(username: string, display_name: string, password_hash: string, is_admin = false, is_owner = false): Promise<User> {
  const join_date = new Date().toISOString();
  await dbClient.execute({
    sql: `INSERT INTO users (username, display_name, password_hash, is_admin, is_owner, join_date) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [username.toLowerCase(), display_name, password_hash, is_admin ? 1 : 0, is_owner ? 1 : 0, join_date],
  });
  return { username: username.toLowerCase(), display_name, password_hash, is_admin, is_owner, join_date };
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
  }));
}

export async function updateUserRole(username: string, is_admin: boolean): Promise<boolean> {
  const res = await dbClient.execute({
    sql: `UPDATE users SET is_admin = ? WHERE username = ? AND is_owner = 0`,
    args: [is_admin ? 1 : 0, username.toLowerCase()],
  });
  return res.rowsAffected > 0;
}

export async function deleteUser(username: string): Promise<boolean> {
  const res = await dbClient.execute({
    sql: `DELETE FROM users WHERE username = ? AND is_owner = 0`,
    args: [username.toLowerCase()],
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
export async function createStoryverse(id: string, title: string, description: string, author: string): Promise<Storyverse> {
  const created_at = new Date().toISOString();
  await dbClient.execute({
    sql: `INSERT INTO storyverses (id, title, description, author, created_at) VALUES (?, ?, ?, ?, ?)`,
    args: [id, title, description, author.toLowerCase(), created_at],
  });
  return { id, title, description, author: author.toLowerCase(), created_at };
}

export async function updateStoryverse(id: string, title: string, description: string): Promise<boolean> {
  const res = await dbClient.execute({
    sql: `UPDATE storyverses SET title = ?, description = ? WHERE id = ?`,
    args: [title, description, id],
  });
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
  };
}

export async function getAllStoryverses(): Promise<Storyverse[]> {
  const res = await dbClient.execute(`SELECT * FROM storyverses ORDER BY created_at DESC`);
  const list: Storyverse[] = [];
  for (const row of res.rows) {
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
  storyverse_id: string | null
): Promise<Storybook> {
  const created_at = new Date().toISOString();
  await dbClient.execute({
    sql: `INSERT INTO storybooks (id, title, description, authors, categories, created_at, allow_other_author_edit, storyverse_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, title, description, authors, categories, created_at, allow_other_author_edit ? 1 : 0, storyverse_id],
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
  };
}

export async function updateStorybook(
  id: string,
  title: string,
  description: string,
  categories: string,
  allow_other_author_edit: boolean,
  storyverse_id: string | null
): Promise<boolean> {
  const res = await dbClient.execute({
    sql: `UPDATE storybooks SET title = ?, description = ?, categories = ?, allow_other_author_edit = ?, storyverse_id = ? WHERE id = ?`,
    args: [title, description, categories, allow_other_author_edit ? 1 : 0, storyverse_id, id],
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
  };
}

export async function getAllStorybooks(): Promise<Storybook[]> {
  const res = await dbClient.execute(`SELECT * FROM storybooks ORDER BY created_at DESC`);
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


// Shared Character Helpers
export async function createSharedCharacter(
  id: string,
  name: string,
  other_info: string,
  storyverse_id: string,
  author: string
): Promise<SharedCharacter> {
  const created_at = new Date().toISOString();
  await dbClient.execute({
    sql: `INSERT INTO shared_characters (id, name, other_info, storyverse_id, author, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, name, other_info, storyverse_id, author.toLowerCase(), created_at],
  });
  return { id, name, other_info, storyverse_id, author: author.toLowerCase(), created_at };
}

export async function getSharedCharacterById(id: string): Promise<SharedCharacter | null> {
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
    other_info: row.other_info as string,
    storyverse_id: row.storyverse_id as string,
    author: row.author as string,
    created_at: row.created_at as string,
    comments_count: commentsCount,
    likes_count: likesCount,
  };
}

export async function getCharactersByStoryverse(storyverse_id: string): Promise<SharedCharacter[]> {
  const res = await dbClient.execute({
    sql: `SELECT * FROM shared_characters WHERE storyverse_id = ?`,
    args: [storyverse_id],
  });
  const list: SharedCharacter[] = [];
  for (const row of res.rows) {
    const commentsCount = await getCommentsCount("character", row.id as string);
    const likesCount = await getLikesCount("character", row.id as string);
    list.push({
      id: row.id as string,
      name: row.name as string,
      other_info: row.other_info as string,
      storyverse_id: row.storyverse_id as string,
      author: row.author as string,
      created_at: row.created_at as string,
      comments_count: commentsCount,
      likes_count: likesCount,
    });
  }
  return list;
}

export async function deleteSharedCharacter(id: string): Promise<boolean> {
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
  target_id: string
): Promise<Comment> {
  const created_at = new Date().toISOString();
  await dbClient.execute({
    sql: `INSERT INTO comments (id, author, content, reply_to, target_type, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, author.toLowerCase(), content, reply_to, target_type, target_id, created_at],
  });

  const user = await getUserByUsername(author);

  return {
    id,
    author: author.toLowerCase(),
    content,
    reply_to,
    target_type,
    target_id,
    created_at,
    author_display_name: user?.display_name || author,
  };
}

export async function getCommentsForTarget(
  target_type: "storybook" | "storyverse" | "character",
  target_id: string
): Promise<Comment[]> {
  const res = await dbClient.execute({
    sql: `
      SELECT c.*, u.display_name as author_display_name
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
    author_display_name: (row.author_display_name as string) || (row.author as string),
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
