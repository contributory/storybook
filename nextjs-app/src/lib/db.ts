import { createClient, type Client } from "@libsql/client";

// Environment variables
const TURSO_DB_URL = process.env.TURSO_DB_URL || "";
const TURSO_DB_AUTH_TOKEN = process.env.TURSO_DB_AUTH_TOKEN || "";

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
  created_storybook?: number;
  created_storyverse?: number;
  following?: string[];
  followers?: string[];
}

export interface Storyverse {
  id: string;
  title: string;
  description: string;
  author: string;
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
  authors: string;
  categories: string;
  created_at: string;
  allow_other_author_edit: boolean;
  storyverse_id: string | null;
  chapters_count?: number;
  comments_count?: number;
  likes_count?: number;
  views_count?: number;
  thumbnail_url?: string;
  chapter_list?: Chapter[];
}

export interface Chapter {
  id: string;
  storybook_id: string;
  chapter_number: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  comments_count?: number;
  likes_count?: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  author: string;
  storyverse_id: string;
  created_at: string;
  image_url?: string;
  comments_count?: number;
  likes_count?: number;
}

export interface Notification {
  id: string;
  user_to: string;
  user_from: string;
  notification_type: string;
  content: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}

// Helper function to execute queries
export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const result = await dbClient.execute({ sql: query, args: params });
  return result.rows as T[];
}

// Initialize Database tables
export async function initDb() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      is_owner INTEGER DEFAULT 0,
      join_date TEXT DEFAULT (datetime('now')),
      is_creator INTEGER DEFAULT 0,
      ai_author_name TEXT DEFAULT '',
      api_token TEXT DEFAULT '',
      des TEXT DEFAULT '',
      avatar TEXT DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS storyverses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      characters TEXT DEFAULT '',
      FOREIGN KEY (author) REFERENCES users(username)
    )`,
    `CREATE TABLE IF NOT EXISTS storybooks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      authors TEXT NOT NULL,
      categories TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      allow_other_author_edit INTEGER DEFAULT 0,
      storyverse_id TEXT,
      thumbnail_url TEXT DEFAULT '',
      FOREIGN KEY (storyverse_id) REFERENCES storyverses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      storybook_id TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (storybook_id) REFERENCES storybooks(id)
    )`,
    `CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      author TEXT NOT NULL,
      storyverse_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      image_url TEXT DEFAULT '',
      FOREIGN KEY (author) REFERENCES users(username),
      FOREIGN KEY (storyverse_id) REFERENCES storyverses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_to TEXT NOT NULL,
      user_from TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      content TEXT NOT NULL,
      reference_id TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_to) REFERENCES users(username),
      FOREIGN KEY (user_from) REFERENCES users(username)
    )`,
    `CREATE TABLE IF NOT EXISTS follows (
      follower_username TEXT NOT NULL,
      followed_username TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (follower_username, followed_username),
      FOREIGN KEY (follower_username) REFERENCES users(username),
      FOREIGN KEY (followed_username) REFERENCES users(username)
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      user_username TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      storybook_id TEXT,
      storyverse_id TEXT,
      character_id TEXT,
      chapter_number INTEGER,
      parent_comment_id TEXT,
      FOREIGN KEY (user_username) REFERENCES users(username),
      FOREIGN KEY (storybook_id) REFERENCES storybooks(id),
      FOREIGN KEY (storyverse_id) REFERENCES storyverses(id),
      FOREIGN KEY (character_id) REFERENCES characters(id)
    )`,
    `CREATE TABLE IF NOT EXISTS likes (
      user_username TEXT NOT NULL,
      storybook_id TEXT,
      storyverse_id TEXT,
      character_id TEXT,
      comment_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_username, storybook_id, storyverse_id, character_id, comment_id),
      FOREIGN KEY (user_username) REFERENCES users(username),
      FOREIGN KEY (storybook_id) REFERENCES storybooks(id),
      FOREIGN KEY (storyverse_id) REFERENCES storyverses(id),
      FOREIGN KEY (character_id) REFERENCES characters(id),
      FOREIGN KEY (comment_id) REFERENCES comments(id)
    )`,
    `CREATE TABLE IF NOT EXISTS reading_progress (
      user_username TEXT NOT NULL,
      storybook_id TEXT NOT NULL,
      last_chapter_read INTEGER NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_username, storybook_id),
      FOREIGN KEY (user_username) REFERENCES users(username),
      FOREIGN KEY (storybook_id) REFERENCES storybooks(id)
    )`,
  ];

  for (const query of queries) {
    await dbClient.execute(query);
  }
  console.log("Database tables initialized.");
}

// User operations
export async function getUserByUsername(username: string): Promise<User | null> {
  const rows = await executeQuery<User>(
    "SELECT * FROM users WHERE username = ?",
    [username.toLowerCase()]
  );
  return rows[0] || null;
}

export async function getUserByApiToken(apiToken: string): Promise<User | null> {
  const rows = await executeQuery<User>(
    "SELECT * FROM users WHERE api_token = ?",
    [apiToken]
  );
  return rows[0] || null;
}

export async function createUser(
  username: string,
  displayName: string,
  passwordHash: string,
  isAdmin = false,
  isOwner = false
): Promise<void> {
  await executeQuery(
    `INSERT INTO users (username, display_name, password_hash, is_admin, is_owner, api_token) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      username.toLowerCase(),
      displayName,
      passwordHash,
      isAdmin ? 1 : 0,
      isOwner ? 1 : 0,
      crypto.randomUUID(),
    ]
  );
}

export async function updateUserProfile(
  username: string,
  updates: Partial<User>
): Promise<void> {
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key !== "username" && value !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (setClauses.length > 0) {
    values.push(username.toLowerCase());
    await executeQuery(
      `UPDATE users SET ${setClauses.join(", ")} WHERE username = ?`,
      values
    );
  }
}

export async function generateNewApiToken(username: string): Promise<string> {
  const newToken = crypto.randomUUID();
  await executeQuery(
    "UPDATE users SET api_token = ? WHERE username = ?",
    [newToken, username.toLowerCase()]
  );
  return newToken;
}

// Storyverse operations
export async function getAllStoryverses(): Promise<Storyverse[]> {
  return await executeQuery<Storyverse>("SELECT * FROM storyverses ORDER BY created_at DESC");
}

export async function getStoryverseById(id: string): Promise<Storyverse | null> {
  const rows = await executeQuery<Storyverse>(
    "SELECT * FROM storyverses WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

export async function getStoryversesPaginated(page: number, limit: number): Promise<{ 
  data: Storyverse[]; 
  total: number; 
  hasMore: boolean 
}> {
  const offset = (page - 1) * limit;
  const data = await executeQuery<Storyverse>(
    "SELECT * FROM storyverses ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  const countRows = await executeQuery<{ count: number }>("SELECT COUNT(*) as count FROM storyverses");
  const total = countRows[0]?.count || 0;
  return {
    data,
    total,
    hasMore: offset + data.length < total,
  };
}

export async function createStoryverse(
  id: string,
  title: string,
  description: string,
  author: string
): Promise<void> {
  await executeQuery(
    "INSERT INTO storyverses (id, title, description, author) VALUES (?, ?, ?, ?)",
    [id, title, description, author.toLowerCase()]
  );
}

export async function updateStoryverse(
  id: string,
  updates: Partial<Storyverse>
): Promise<void> {
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key !== "id" && key !== "author" && key !== "created_at" && value !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (setClauses.length > 0) {
    values.push(id);
    await executeQuery(
      `UPDATE storyverses SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );
  }
}

export async function deleteStoryverse(id: string): Promise<void> {
  await executeQuery("DELETE FROM storyverses WHERE id = ?", [id]);
}

export async function getCharactersByStoryverse(storyverseId: string): Promise<Character[]> {
  return await executeQuery<Character>(
    "SELECT * FROM characters WHERE storyverse_id = ? ORDER BY created_at DESC",
    [storyverseId]
  );
}

export async function searchStoryverses(query: string, limit: number = 15): Promise<Storyverse[]> {
  const searchPattern = `%${query}%`;
  return await executeQuery<Storyverse>(
    "SELECT * FROM storyverses WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT ?",
    [searchPattern, searchPattern, limit]
  );
}

// Storybook operations
export async function getAllStorybooks(): Promise<Storybook[]> {
  return await executeQuery<Storybook>("SELECT * FROM storybooks ORDER BY created_at DESC");
}

export async function getStorybooksPaginated(page: number, limit: number): Promise<{
  data: Storybook[];
  total: number;
  hasMore: boolean;
}> {
  const offset = (page - 1) * limit;
  const data = await executeQuery<Storybook>(
    "SELECT * FROM storybooks ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  const countRows = await executeQuery<{ count: number }>("SELECT COUNT(*) as count FROM storybooks");
  const total = countRows[0]?.count || 0;
  return {
    data,
    total,
    hasMore: offset + data.length < total,
  };
}

export async function getStorybookById(id: string): Promise<Storybook | null> {
  const rows = await executeQuery<Storybook>(
    "SELECT * FROM storybooks WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

export async function createStorybook(
  id: string,
  title: string,
  description: string,
  authors: string,
  categories: string,
  storyverseId: string | null,
  allowOtherAuthorEdit: boolean
): Promise<void> {
  await executeQuery(
    `INSERT INTO storybooks (id, title, description, authors, categories, storyverse_id, allow_other_author_edit) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, title, description, authors, categories, storyverseId, allowOtherAuthorEdit ? 1 : 0]
  );
}

export async function updateStorybook(
  id: string,
  updates: Partial<Storybook>
): Promise<void> {
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key !== "id" && key !== "created_at" && value !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (setClauses.length > 0) {
    values.push(id);
    await executeQuery(
      `UPDATE storybooks SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );
  }
}

export async function deleteStorybook(id: string): Promise<void> {
  await executeQuery("DELETE FROM storybooks WHERE id = ?", [id]);
}

export async function searchStorybooks(query: string, limit: number = 15): Promise<Storybook[]> {
  const searchPattern = `%${query}%`;
  return await executeQuery<Storybook>(
    "SELECT * FROM storybooks WHERE title LIKE ? OR description LIKE ? OR authors LIKE ? ORDER BY created_at DESC LIMIT ?",
    [searchPattern, searchPattern, searchPattern, limit]
  );
}

// Chapter operations
export async function getChaptersList(storybookId: string): Promise<Omit<Chapter, "content">[]> {
  return await executeQuery<Omit<Chapter, "content">>(
    "SELECT id, storybook_id, chapter_number, title, created_at, updated_at FROM chapters WHERE storybook_id = ? ORDER BY chapter_number ASC",
    [storybookId]
  );
}

export async function getChapter(storybookId: string, chapterNumber: number): Promise<Chapter | null> {
  const rows = await executeQuery<Chapter>(
    "SELECT * FROM chapters WHERE storybook_id = ? AND chapter_number = ?",
    [storybookId, chapterNumber]
  );
  return rows[0] || null;
}

export async function createChapter(
  id: string,
  storybookId: string,
  chapterNumber: number,
  title: string,
  content: string
): Promise<void> {
  await executeQuery(
    `INSERT INTO chapters (id, storybook_id, chapter_number, title, content) 
     VALUES (?, ?, ?, ?, ?)`,
    [id, storybookId, chapterNumber, title, content]
  );
}

export async function updateChapter(
  storybookId: string,
  chapterNumber: number,
  updates: Partial<Chapter>
): Promise<void> {
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key !== "id" && key !== "storybook_id" && key !== "chapter_number" && value !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (setClauses.length > 0) {
    values.push(storybookId, chapterNumber);
    await executeQuery(
      `UPDATE chapters SET ${setClauses.join(", ")} WHERE storybook_id = ? AND chapter_number = ?`,
      values
    );
  }
}

export async function deleteChapter(storybookId: string, chapterNumber: number): Promise<void> {
  await executeQuery(
    "DELETE FROM chapters WHERE storybook_id = ? AND chapter_number = ?",
    [storybookId, chapterNumber]
  );
}

// Character operations
export async function getAllCharacters(): Promise<Character[]> {
  return await executeQuery<Character>("SELECT * FROM characters ORDER BY created_at DESC");
}

export async function getCharactersPaginated(page: number, limit: number): Promise<{
  data: Character[];
  total: number;
  hasMore: boolean;
}> {
  const offset = (page - 1) * limit;
  const data = await executeQuery<Character>(
    "SELECT * FROM characters ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  const countRows = await executeQuery<{ count: number }>("SELECT COUNT(*) as count FROM characters");
  const total = countRows[0]?.count || 0;
  return {
    data,
    total,
    hasMore: offset + data.length < total,
  };
}

export async function getCharacterById(id: string): Promise<Character | null> {
  const rows = await executeQuery<Character>(
    "SELECT * FROM characters WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

export async function createCharacter(
  id: string,
  name: string,
  description: string,
  author: string,
  storyverseId: string,
  imageUrl?: string
): Promise<void> {
  await executeQuery(
    `INSERT INTO characters (id, name, description, author, storyverse_id, image_url) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, description, author.toLowerCase(), storyverseId, imageUrl || ""]
  );
}

export async function updateCharacter(
  id: string,
  updates: Partial<Character>
): Promise<void> {
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key !== "id" && key !== "author" && key !== "created_at" && value !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (setClauses.length > 0) {
    values.push(id);
    await executeQuery(
      `UPDATE characters SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );
  }
}

export async function deleteCharacter(id: string): Promise<void> {
  await executeQuery("DELETE FROM characters WHERE id = ?", [id]);
}

export async function searchCharacters(query: string, limit: number = 15): Promise<Character[]> {
  const searchPattern = `%${query}%`;
  return await executeQuery<Character>(
    "SELECT * FROM characters WHERE name LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT ?",
    [searchPattern, searchPattern, limit]
  );
}

// Notification operations
export async function getUnreadNotificationsCount(username: string): Promise<number> {
  const rows = await executeQuery<{ count: number }>(
    "SELECT COUNT(*) as count FROM notifications WHERE user_to = ? AND is_read = 0",
    [username.toLowerCase()]
  );
  return rows[0]?.count || 0;
}

export async function getNotificationsByUsername(username: string, limit: number = 20): Promise<Notification[]> {
  return await executeQuery<Notification>(
    "SELECT * FROM notifications WHERE user_to = ? ORDER BY created_at DESC LIMIT ?",
    [username.toLowerCase(), limit]
  );
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await executeQuery(
    "UPDATE notifications SET is_read = 1 WHERE id = ?",
    [notificationId]
  );
}

export async function markAllNotificationsAsRead(username: string): Promise<void> {
  await executeQuery(
    "UPDATE notifications SET is_read = 1 WHERE user_to = ?",
    [username.toLowerCase()]
  );
}

export async function createNotification(
  id: string,
  userTo: string,
  userFrom: string,
  notificationType: string,
  content: string,
  referenceId: string = ""
): Promise<void> {
  await executeQuery(
    `INSERT INTO notifications (id, user_to, user_from, notification_type, content, reference_id) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userTo.toLowerCase(), userFrom.toLowerCase(), notificationType, content, referenceId]
  );
}

// Reading progress operations
export async function saveReadingProgress(
  username: string,
  storybookId: string,
  chapterNumber: number
): Promise<void> {
  await executeQuery(
    `INSERT OR REPLACE INTO reading_progress (user_username, storybook_id, last_chapter_read, updated_at) 
     VALUES (?, ?, ?, datetime('now'))`,
    [username.toLowerCase(), storybookId, chapterNumber]
  );
}

export async function getReadingProgress(username: string): Promise<{ storybook_id: string; last_chapter_read: number }[]> {
  return await executeQuery<{ storybook_id: string; last_chapter_read: number }>(
    "SELECT storybook_id, last_chapter_read FROM reading_progress WHERE user_username = ?",
    [username.toLowerCase()]
  );
}

// Follow operations
export async function followUser(followerUsername: string, followedUsername: string): Promise<void> {
  await executeQuery(
    `INSERT OR IGNORE INTO follows (follower_username, followed_username) VALUES (?, ?)`,
    [followerUsername.toLowerCase(), followedUsername.toLowerCase()]
  );
}

export async function unfollowUser(followerUsername: string, followedUsername: string): Promise<void> {
  await executeQuery(
    "DELETE FROM follows WHERE follower_username = ? AND followed_username = ?",
    [followerUsername.toLowerCase(), followedUsername.toLowerCase()]
  );
}

export async function getFollowing(username: string): Promise<string[]> {
  const rows = await executeQuery<{ followed_username: string }>(
    "SELECT followed_username FROM follows WHERE follower_username = ?",
    [username.toLowerCase()]
  );
  return rows.map(r => r.followed_username);
}

export async function getFollowers(username: string): Promise<string[]> {
  const rows = await executeQuery<{ follower_username: string }>(
    "SELECT follower_username FROM follows WHERE followed_username = ?",
    [username.toLowerCase()]
  );
  return rows.map(r => r.follower_username);
}

export async function isFollowing(followerUsername: string, followedUsername: string): Promise<boolean> {
  const rows = await executeQuery(
    "SELECT 1 FROM follows WHERE follower_username = ? AND followed_username = ?",
    [followerUsername.toLowerCase(), followedUsername.toLowerCase()]
  );
  return rows.length > 0;
}

// User search
export async function searchUsers(query: string, limit: number = 15): Promise<User[]> {
  const searchPattern = `%${query}%`;
  return await executeQuery<User>(
    "SELECT * FROM users WHERE username LIKE ? OR display_name LIKE ? LIMIT ?",
    [searchPattern, searchPattern, limit]
  );
}

// Admin operations
export async function getUsersPaginated(page: number, limit: number): Promise<{
  data: User[];
  total: number;
  hasMore: boolean;
}> {
  const offset = (page - 1) * limit;
  const data = await executeQuery<User>(
    "SELECT * FROM users ORDER BY join_date DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  const countRows = await executeQuery<{ count: number }>("SELECT COUNT(*) as count FROM users");
  const total = countRows[0]?.count || 0;
  return {
    data,
    total,
    hasMore: offset + data.length < total,
  };
}

export async function deleteUser(username: string): Promise<void> {
  // Don't allow deleting the owner account
  if (username.toLowerCase() === (process.env.OWNER_USERNAME || "owner").toLowerCase()) {
    throw new Error("Cannot delete owner account");
  }
  await executeQuery("DELETE FROM users WHERE username = ?", [username.toLowerCase()]);
}

export async function updateUserRole(
  username: string,
  role: "admin" | "creator" | "user",
  value: boolean
): Promise<void> {
  const column = role === "admin" ? "is_admin" : role === "creator" ? "is_creator" : null;
  if (!column) return;
  
  await executeQuery(
    `UPDATE users SET ${column} = ? WHERE username = ?`,
    [value ? 1 : 0, username.toLowerCase()]
  );
}
