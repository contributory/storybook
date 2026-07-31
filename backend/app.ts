import { Hono } from "npm:hono";
import { getCookie, setCookie, deleteCookie } from "npm:hono/cookie";
import * as db from "./db.ts";
import { handleMcpRequest } from "./mcp.ts";
import * as ui from "./ui.tsx";

type Variables = {
  user: db.User | null;
};

const app = new Hono<{ Variables: Variables }>();

// Unwrap errors to see stack traces
app.onError((err, c) => {
  console.error("Hono error:", err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});

// App Secret for Cookie signing
const APP_SECRET = Deno.env.get("APP_SECRET") || "hono-deno-storybook-secret-key-123456";

// SHA-256 Hash Helper
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Session Signature Helper
async function generateSessionHash(username: string, passwordHash: string): Promise<string> {
  return await sha256(`${username}:${passwordHash}:${APP_SECRET}`);
}

// Initialize Owner account
export async function ensureOwnerAccount() {
  const ownerUsername = Deno.env.get("OWNER_USERNAME") || "owner";
  const ownerPassword = Deno.env.get("OWNER_PASSWORD") || "owner123";

  const existingOwner = await db.getUserByUsername(ownerUsername);
  const passwordHash = await sha256(ownerPassword);

  if (!existingOwner) {
    console.log(`Creating owner account with username: '${ownerUsername}'`);
    await db.createUser(ownerUsername, "System Owner", passwordHash, true, true);
  } else {
    // Keep password updated with env variables
    await db.executeQuery(
      `UPDATE users SET password_hash = ?, is_admin = 1, is_owner = 1 WHERE username = ?`,
      [passwordHash, ownerUsername.toLowerCase()]
    );
  }
}

// Authentication Middleware
export async function authMiddleware(c: any, next: () => Promise<void>) {
  const username = getCookie(c, "user_username");
  const sessionHash = getCookie(c, "user_session");

  if (!username || !sessionHash) {
    c.set("user", null);
    await next();
    return;
  }

  const user = await db.getUserByUsername(username);
  if (!user) {
    c.set("user", null);
    await next();
    return;
  }

  const expectedHash = await generateSessionHash(user.username, user.password_hash);
  if (sessionHash !== expectedHash) {
    c.set("user", null);
    await next();
    return;
  }

  c.set("user", user);
  await next();
}

app.use("*", authMiddleware);
// Helper to render layout with unread notifications count
export async function renderWithLayout(c: any, title: string, rendered: any, currentPath = "/") {
  const user = c.get("user");
  const count = user ? await db.getUnreadNotificationsCount(user.username) : 0;
  return c.html(ui.layout(title, rendered, user, currentPath, count));
}


// --- S3 PROXY & UPLOAD API ---

app.get("/api/s3-proxy", async c => {
  const key = c.req.query("key");
  if (!key) return c.json({ error: "Missing key" }, 400);
  const obj = await db.getS3Object(key);
  if (!obj) return c.json({ error: "File not found" }, 404);
  return c.body(obj.body as any, 200, {
    "Content-Type": obj.contentType,
    "Cache-Control": "public, max-age=31536000",
  });
});

app.post("/api/upload-thumbnail", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const body = await c.req.parseBody();
    const file = body["file"];
    const type = body["type"] as string;
    const id = body["id"] as string;

    if (!file || !type || !id) {
      return c.json({ success: false, error: "Missing file, type or id" }, 400);
    }

    // Permission checks
    if (type === "storybook") {
      const book = await db.getStorybookById(id);
      if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);
      const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
      const canEdit = isAuthor || user.is_admin || user.is_owner || book.allow_other_author_edit;
      if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);
    } else if (type === "storyverse") {
      const sv = await db.getStoryverseById(id);
      if (!sv) return c.json({ success: false, error: "Storyverse not found" }, 404);
      const canEdit = sv.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
      if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);
    } else if (type === "character") {
      const char = await db.getSharedCharacterById(id);
      if (!char) return c.json({ success: false, error: "Character not found" }, 404);
      const canEdit = char.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
      if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);
    } else {
      return c.json({ success: false, error: "Invalid type" }, 400);
    }

    const url = await db.uploadThumbnail(type, id, file);

    // Save in DB
    if (type === "storybook") {
      await db.executeQuery("UPDATE storybooks SET thumbnail_url = ? WHERE id = ?", [url, id]);
    } else if (type === "storyverse") {
      await db.executeQuery("UPDATE storyverses SET thumbnail_url = ? WHERE id = ?", [url, id]);
    } else if (type === "character") {
      await db.executeQuery("UPDATE shared_characters SET thumbnail_url = ? WHERE id = ?", [url, id]);
    }

    return c.json({ success: true, url });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});



// --- FRONTEND VIEWS ROUTING ---

app.get("/", async c => {
  const user = c.get("user");
  const books = await db.getAllStorybooks();
  const progress = user ? await db.getReadingProgress(user.username) : [];
  const rendered = ui.renderHomepage(books, progress, user);
  return await renderWithLayout(c, "Trang Chủ", rendered, "/");
});

app.get("/storybooks", async c => {
  const books = await db.getAllStorybooks();
  const rendered = ui.renderStorybooksPage(books);
  return await renderWithLayout(c, "Thư Viện Bộ Truyện", rendered, "/storybooks");
});

app.get("/storyverses", async c => {
  const verses = await db.getAllStoryverses();
  const rendered = ui.renderStoryverses(verses);
  return await renderWithLayout(c, "Vũ Trụ Truyện", rendered, "/storyverses");
});

app.get("/storyverses/:id", async c => {
  const sv = await db.getStoryverseById(c.req.param("id"));
  if (!sv) return c.redirect("/");
  const chars = await db.getCharactersByStoryverse(sv.id);
  const user = c.get("user");
  const rendered = ui.renderStoryverseDetail(sv, chars, user);
  return await renderWithLayout(c, sv.title, rendered, `/storyverses`);
});

app.get("/storybook/:id", async c => {
  const user = c.get("user");
  const book = await db.getStorybookById(c.req.param("id"));
  if (!book) return c.redirect("/");
  const chapters = await db.getChaptersList(book.id);
  const rendered = ui.renderStorybookDetail(book, chapters, user);
  return await renderWithLayout(c, book.title, rendered, `/`);
});

app.get("/storybook/:id/chapter/:num", async c => {
  const user = c.get("user");
  const bookId = c.req.param("id");
  const num = Number(c.req.param("num"));

  const book = await db.getStorybookById(bookId);
  const chapter = await db.getChapter(bookId, num);
  if (!book || !chapter) return c.redirect(`/storybook/${bookId}`);

  // Save reading progress in background
  if (user) {
    await db.saveReadingProgress(user.username, bookId, num);
  }

  // Get surrounding chapters for navigation
  const chaptersList = await db.getChaptersList(bookId);
  const curIndex = chaptersList.findIndex(ch => ch.chapter_number === num);
  const prevNum = curIndex > 0 ? chaptersList[curIndex - 1].chapter_number : null;
  const nextNum = curIndex < chaptersList.length - 1 ? chaptersList[curIndex + 1].chapter_number : null;

  const rendered = ui.renderChapterReader(book, chapter, nextNum, prevNum);
  return await renderWithLayout(c, `Chương ${num}: ${chapter.title} - ${book.title}`, rendered, `/`);
});

app.get("/creator", async c => {
  const user = c.get("user");
  if (!user) return c.redirect("/"); // Require login
  if (!user.is_creator && !user.is_admin && !user.is_owner) {
    return c.redirect("/settings"); // Restrict access to /creator if not creator
  }

  const allBooks = await db.getAllStorybooks();
  // Allow creators to see books they auth, or any books that allow edits
  const books = allBooks.filter(b => b.authors.toLowerCase().includes(user.username.toLowerCase()) || b.allow_other_author_edit);
  const universes = await db.getAllStoryverses();

  const rendered = ui.renderCreatorPanel(books, universes, c.req.query("book_id") || "");
  return await renderWithLayout(c, "Nhà Sáng Tạo", rendered, "/creator");
});

app.get("/admin", async c => {
  const user = c.get("user");
  if (!user || (!user.is_admin && !user.is_owner)) return c.redirect("/");

  const users = await db.getAllUsers();
  const rendered = ui.renderAdminPanel(users);
  return await renderWithLayout(c, "Quản Trị Hệ Thống", rendered, "/admin");
});



// --- PROFILE & SETTINGS ROUTES ---

app.get("/profile", async c => {
  const user = c.get("user");
  if (!user) return c.redirect("/");
  return c.redirect(`/profile/${user.username}`);
});

app.get("/profile/:username", async c => {
  const currentUser = c.get("user");
  const targetUsername = c.req.param("username").toLowerCase();

  const profileUser = await db.getUserByUsername(targetUsername);
  if (!profileUser) return c.redirect("/");

  const allBooks = await db.getAllStorybooks();
  const books = allBooks.filter(b => b.authors.toLowerCase().includes(targetUsername));

  const allVerses = await db.getAllStoryverses();
  const verses = allVerses.filter(v => v.author.toLowerCase() === targetUsername);

  const followers = await db.getFollowers(targetUsername);
  const following = await db.getFollowing(targetUsername);
  const isFollowing = currentUser ? followers.includes(currentUser.username) : false;

  const rendered = ui.renderProfilePage(
    profileUser,
    currentUser ? currentUser.username === targetUsername : false,
    books,
    verses,
    isFollowing,
    followers.length,
    following.length,
    currentUser
  );

  return await renderWithLayout(c, `Hồ sơ @${profileUser.username}`, rendered);
});

app.get("/settings", async c => {
  const user = c.get("user");
  if (!user) return c.redirect("/");

  const rendered = ui.renderSettingsPage(user);
  return await renderWithLayout(c, "Cài đặt cá nhân", rendered, "/settings");
});

app.post("/api/settings", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const { display_name, is_creator, ai_author_name } = await c.req.json();
    if (!display_name) {
      return c.json({ success: false, error: "Display name is required" }, 400);
    }

    const success = await db.updateUserSettings(
      user.username,
      display_name.trim(),
      !!is_creator,
      (ai_author_name || "").trim()
    );

    return c.json({ success });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post("/api/settings/token", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const rawToken = `sb_tok_${crypto.randomUUID().replace(/-/g, "")}`;
    const success = await db.updateUserApiToken(user.username, rawToken);
    return c.json({ success, token: rawToken });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- AUTH API ---

app.post("/api/auth/register", async c => {
  try {
    const { username, password, display_name } = await c.req.json();
    if (!username || !password) {
      return c.json({ success: false, error: "Username and Password are required" }, 400);
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || password.length < 4) {
      return c.json({ success: false, error: "Username must be >= 3 chars, password >= 4 chars" }, 400);
    }

    const existingUser = await db.getUserByUsername(cleanUsername);
    if (existingUser) {
      return c.json({ success: false, error: "Username is already taken" }, 400);
    }

    const pwdHash = await sha256(password);
    const displayName = (display_name || username).trim();

    const newUser = await db.createUser(cleanUsername, displayName, pwdHash, false, false);

    // Auto login
    const sessionHash = await generateSessionHash(newUser.username, newUser.password_hash);
    const maxAge = 60 * 60 * 24 * 365; // 365 days permanent cookie (max 400 days constraint)
    setCookie(c, "user_username", newUser.username, { path: "/", maxAge });
    setCookie(c, "user_session", sessionHash, { path: "/", maxAge });

    return c.json({ success: true, user: { username: newUser.username, display_name: newUser.display_name, is_admin: false, is_owner: false } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post("/api/auth/login", async c => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ success: false, error: "Username and password required" }, 400);
    }

    const user = await db.getUserByUsername(username);
    if (!user) {
      return c.json({ success: false, error: "Incorrect username or password" }, 400);
    }

    const inputHash = await sha256(password);
    if (user.password_hash !== inputHash) {
      return c.json({ success: false, error: "Incorrect username or password" }, 400);
    }

    // Set permanent cookies
    const sessionHash = await generateSessionHash(user.username, user.password_hash);
    const maxAge = 60 * 60 * 24 * 365; // 365 days permanent cookie
    setCookie(c, "user_username", user.username, { path: "/", maxAge });
    setCookie(c, "user_session", sessionHash, { path: "/", maxAge });

    return c.json({
      success: true,
      user: {
        username: user.username,
        display_name: user.display_name,
        is_admin: user.is_admin,
        is_owner: user.is_owner,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post("/api/auth/logout", async c => {
  deleteCookie(c, "user_username", { path: "/" });
  deleteCookie(c, "user_session", { path: "/" });
  return c.json({ success: true });
});

app.get("/api/auth/me", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, user: null });
  return c.json({
    success: true,
    user: {
      username: user.username,
      display_name: user.display_name,
      is_admin: user.is_admin,
      is_owner: user.is_owner,
    },
  });
});


// --- STORYBOOK API ---

app.get("/api/storybooks", async c => {
  const books = await db.getAllStorybooks();
  return c.json({ success: true, storybooks: books });
});

app.post("/api/storybooks", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const { id, title, description, categories, allow_other_author_edit, storyverse_id, characters } = await c.req.json();
    if (!id || !title || !description || !categories) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanId) return c.json({ success: false, error: "Invalid Storybook ID" }, 400);

    const exist = await db.getStorybookById(cleanId);
    if (exist) return c.json({ success: false, error: "Storybook ID already exists" }, 400);

    const book = await db.createStorybook(
      cleanId,
      title.trim(),
      description.trim(),
      user.username, // Original author
      categories.trim(),
      !!allow_other_author_edit,
      storyverse_id || null,
      "",
      characters !== undefined ? (typeof characters === "string" ? characters : JSON.stringify(characters)) : "[]"
    );

    return c.json({ success: true, storybook: book });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get("/api/storybooks/:id", async c => {
  const book = await db.getStorybookById(c.req.param("id"));
  if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);
  return c.json({ success: true, storybook: book });
});

app.put("/api/storybooks/:id", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const bookId = c.req.param("id");
  const book = await db.getStorybookById(bookId);
  if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);

  // Auth check: original creator, or system admin/owner, or other author if editing is allowed
  const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
  const canEdit = isAuthor || user.is_admin || user.is_owner || book.allow_other_author_edit;

  if (!canEdit) {
    return c.json({ success: false, error: "You don't have permission to edit this book" }, 403);
  }

  try {
    const { title, description, categories, allow_other_author_edit, storyverse_id, characters } = await c.req.json();
    const updated = await db.updateStorybook(
      bookId,
      title || book.title,
      description || book.description,
      categories || book.categories,
      allow_other_author_edit !== undefined ? !!allow_other_author_edit : book.allow_other_author_edit,
      storyverse_id !== undefined ? (storyverse_id || null) : book.storyverse_id,
      undefined,
      characters !== undefined ? (typeof characters === "string" ? characters : JSON.stringify(characters)) : undefined
    );

    // If another author is editing and not in authors list, append their name
    if (updated && !isAuthor && book.allow_other_author_edit) {
      const newAuthors = `${book.authors}, ${user.username}`;
      await db.executeQuery(`UPDATE storybooks SET authors = ? WHERE id = ?`, [newAuthors, bookId]);
    }

    return c.json({ success: true, message: "Storybook updated successfully" });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.delete("/api/storybooks/:id", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const bookId = c.req.param("id");
  const book = await db.getStorybookById(bookId);
  if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);

  const isAuthor = book.authors.toLowerCase().split(",").map(a => a.trim()).includes(user.username.toLowerCase());
  const canDelete = isAuthor || user.is_admin || user.is_owner;

  if (!canDelete) return c.json({ success: false, error: "Forbidden" }, 403);

  const success = await db.deleteStorybook(bookId);
  return c.json({ success, message: success ? "Storybook deleted" : "Failed to delete" });
});


// --- CHAPTERS API ---

app.get("/api/storybooks/:id/chapters", async c => {
  const list = await db.getChaptersList(c.req.param("id"));
  return c.json({ success: true, chapters: list });
});

app.get("/api/storybooks/:id/chapters/:num", async c => {
  const bookId = c.req.param("id");
  const num = Number(c.req.param("num"));

  const user = c.get("user");
  const chapter = await db.getChapter(bookId, num);
  if (!chapter) return c.json({ success: false, error: "Chapter not found" }, 404);

  // Save reading progress if user is logged in
  if (user) {
    await db.saveReadingProgress(user.username, bookId, num);
  }

  return c.json({ success: true, chapter });
});

app.post("/api/storybooks/:id/chapters", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const bookId = c.req.param("id");
  const book = await db.getStorybookById(bookId);
  if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);

  const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
  const canEdit = isAuthor || user.is_admin || user.is_owner || book.allow_other_author_edit;

  if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);

  try {
    const { chapter_number, title, content, summary } = await c.req.json();
    if (!chapter_number || !title || !content) {
      return c.json({ success: false, error: "Missing chapter details" }, 400);
    }

    const chapter = await db.createOrEditChapter(
      bookId,
      Number(chapter_number),
      title.trim(),
      content.trim(),
      (summary || "").trim()
    );

    return c.json({ success: true, chapter });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.delete("/api/storybooks/:id/chapters/:num", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const bookId = c.req.param("id");
  const num = Number(c.req.param("num"));

  const book = await db.getStorybookById(bookId);
  if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);

  const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
  const canDelete = isAuthor || user.is_admin || user.is_owner;

  if (!canDelete) return c.json({ success: false, error: "Forbidden" }, 403);

  const success = await db.deleteChapter(bookId, num);
  return c.json({ success, message: success ? "Chapter deleted" : "Failed to delete" });
});


// --- STORYVERSE API ---

app.get("/api/storyverses", async c => {
  const universes = await db.getAllStoryverses();
  return c.json({ success: true, storyverses: universes });
});

app.post("/api/storyverses", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const { id, title, description } = await c.req.json();
    if (!id || !title || !description) {
      return c.json({ success: false, error: "Missing fields" }, 400);
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const exist = await db.getStoryverseById(cleanId);
    if (exist) return c.json({ success: false, error: "Storyverse ID already exists" }, 400);

    const universe = await db.createStoryverse(cleanId, title.trim(), description.trim(), user.username);
    return c.json({ success: true, storyverse: universe });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get("/api/storyverses/:id", async c => {
  const universe = await db.getStoryverseById(c.req.param("id"));
  if (!universe) return c.json({ success: false, error: "Storyverse not found" }, 404);

  // Fetch shared characters in this storyverse
  const characters = await db.getCharactersByStoryverse(universe.id);

  return c.json({ success: true, storyverse: universe, characters });
});

app.put("/api/storyverses/:id", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const universeId = c.req.param("id");
  const universe = await db.getStoryverseById(universeId);
  if (!universe) return c.json({ success: false, error: "Storyverse not found" }, 404);

  const canEdit = universe.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
  if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);

  try {
    const { title, description } = await c.req.json();
    const success = await db.updateStoryverse(universeId, title || universe.title, description || universe.description);
    return c.json({ success, message: success ? "Storyverse updated" : "Failed" });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.delete("/api/storyverses/:id", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const universeId = c.req.param("id");
  const universe = await db.getStoryverseById(universeId);
  if (!universe) return c.json({ success: false, error: "Storyverse not found" }, 404);

  const canDelete = universe.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
  if (!canDelete) return c.json({ success: false, error: "Forbidden" }, 403);

  const success = await db.deleteStoryverse(universeId);
  return c.json({ success, message: success ? "Storyverse deleted" : "Failed" });
});


// --- SHARED CHARACTERS API ---

app.get("/api/characters/:id", async c => {
  const char = await db.getSharedCharacterById(c.req.param("id"));
  if (!char) return c.json({ success: false, error: "Character not found" }, 404);
  return c.json({ success: true, character: char });
});

app.post("/api/characters", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const { id, name, other_info, storyverse_id } = await c.req.json();
    if (!id || !name || !storyverse_id) {
      return c.json({ success: false, error: "Missing fields" }, 400);
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const exist = await db.getSharedCharacterById(cleanId);
    if (exist) return c.json({ success: false, error: "Character ID already taken" }, 400);

    const character = await db.createSharedCharacter(
      cleanId,
      name.trim(),
      typeof other_info === "object" ? JSON.stringify(other_info) : other_info,
      storyverse_id,
      user.username
    );

    return c.json({ success: true, character });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.put("/api/characters/:id", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const charId = c.req.param("id");
  const character = await db.getSharedCharacterById(charId);
  if (!character) return c.json({ success: false, error: "Character not found" }, 404);

  const canEdit = character.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
  if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);

  try {
    const { name, other_info } = await c.req.json();
    const success = await db.updateSharedCharacter(
      charId,
      name || character.name,
      other_info !== undefined ? other_info : character.other_info
    );
    return c.json({ success, message: success ? "Character updated" : "Failed to update character" });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.delete("/api/characters/:id", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const charId = c.req.param("id");
  const character = await db.getSharedCharacterById(charId);
  if (!character) return c.json({ success: false, error: "Character not found" }, 404);

  const canDelete = character.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
  if (!canDelete) return c.json({ success: false, error: "Forbidden" }, 403);

  const success = await db.deleteSharedCharacter(charId);
  return c.json({ success, message: success ? "Character deleted" : "Failed" });
});


// --- FOLLOWS API ---

app.post("/api/users/:username/follow", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const targetUser = c.req.param("username");
  const { action } = await c.req.json(); // "follow" or "unfollow"

  if (action === "follow") {
    const ok = await db.followUser(user.username, targetUser);
    return c.json({ success: ok, message: ok ? "Followed" : "Failed" });
  } else {
    const ok = await db.unfollowUser(user.username, targetUser);
    return c.json({ success: ok, message: ok ? "Unfollowed" : "Failed" });
  }
});


// --- COMMENTS & LIKES API ---


// --- NOTIFICATIONS VIEW & API ---

app.get("/notifications", async c => {
  const user = c.get("user");
  if (!user) return c.redirect("/");

  const list = await db.getNotificationsForUser(user.username);
  const rendered = ui.renderNotificationsPage(list);
  return await renderWithLayout(c, "Thông báo của bạn", rendered, "/notifications");
});

app.get("/notifications/:id/click", async c => {
  const user = c.get("user");
  if (!user) return c.redirect("/");

  const id = c.req.param("id");
  await db.markNotificationAsRead(id);

  const res = await db.executeQuery("SELECT target_type, target_id FROM notifications WHERE id = ?", [id]);
  if (res.rows.length === 0) return c.redirect("/notifications");

  const type = res.rows[0].target_type as string;
  const targetId = res.rows[0].target_id as string;

  if (type === "storybook") {
    return c.redirect(`/storybook/${targetId}`);
  } else if (type === "storyverse") {
    return c.redirect(`/storyverses/${targetId}`);
  } else if (type === "character") {
    const char = await db.getSharedCharacterById(targetId);
    if (char) {
      return c.redirect(`/storyverses/${char.storyverse_id}`);
    }
    return c.redirect("/storyverses");
  }

  return c.redirect("/notifications");
});

app.post("/api/notifications/read-all", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    await db.executeQuery("UPDATE notifications SET is_read = 1 WHERE username = ?", [user.username.toLowerCase()]);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post("/api/comments", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const { content, target_type, target_id, reply_to } = await c.req.json();
    if (!content || !target_type || !target_id) {
      return c.json({ success: false, error: "Missing comment details" }, 400);
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const comment = await db.addComment(
      commentId,
      user.username,
      content.trim(),
      reply_to || null,
      target_type,
      target_id
    );

    // Create notifications for the relevant author(s)
    try {
      if (reply_to) {
        const parentRes = await db.executeQuery("SELECT author, content FROM comments WHERE id = ?", [reply_to]);
        if (parentRes.rows.length > 0) {
          const parentAuthor = parentRes.rows[0].author as string;
          if (parentAuthor.toLowerCase() !== user.username.toLowerCase()) {
            await db.createNotification(
              parentAuthor,
              user.username,
              "reply",
              target_type,
              target_id,
              commentId,
              `đã phản hồi bình luận của bạn: "${content.substring(0, 50)}..."`
            );
          }
        }
      } else {
        if (target_type === "storybook") {
          const book = await db.getStorybookById(target_id);
          if (book) {
            const authorsList = book.authors.split(",").map(a => a.trim().toLowerCase());
            for (const auth of authorsList) {
              if (auth && auth !== user.username.toLowerCase()) {
                await db.createNotification(
                  auth,
                  user.username,
                  "comment",
                  "storybook",
                  target_id,
                  commentId,
                  `đã bình luận về truyện "${book.title}": "${content.substring(0, 50)}..."`
                );
              }
            }
          }
        } else if (target_type === "storyverse") {
          const sv = await db.getStoryverseById(target_id);
          if (sv && sv.author.toLowerCase() !== user.username.toLowerCase()) {
            await db.createNotification(
              sv.author,
              user.username,
              "comment",
              "storyverse",
              target_id,
              commentId,
              `đã bình luận về bối cảnh "${sv.title}": "${content.substring(0, 50)}..."`
            );
          }
        } else if (target_type === "character") {
          const char = await db.getSharedCharacterById(target_id);
          if (char && char.author.toLowerCase() !== user.username.toLowerCase()) {
            await db.createNotification(
              char.author,
              user.username,
              "comment",
              "character",
              target_id,
              commentId,
              `đã bình luận về nhân vật "${char.name}": "${content.substring(0, 50)}..."`
            );
          }
        }
      }
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }

    return c.json({ success: true, comment });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get("/api/comments/:type/:id", async c => {
  const type = c.req.param("type") as "storybook" | "storyverse" | "character";
  const id = c.req.param("id");
  const comments = await db.getCommentsForTarget(type, id);
  return c.json({ success: true, comments });
});

app.post("/api/likes", async c => {
  const user = c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const { target_type, target_id } = await c.req.json();
    if (!target_type || !target_id) {
      return c.json({ success: false, error: "Missing fields" }, 400);
    }

    const result = await db.toggleLike(user.username, target_type, target_id);
    const count = await db.getLikesCount(target_type, target_id);

    return c.json({ success: true, ...result, count });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get("/api/likes/:type/:id", async c => {
  const type = c.req.param("type") as "storybook" | "storyverse" | "character";
  const id = c.req.param("id");

  const user = c.get("user");
  const count = await db.getLikesCount(type, id);
  const liked = user ? await db.isLikedByUser(user.username, type, id) : false;

  return c.json({ success: true, count, liked });
});


// --- ADMIN API ---

app.get("/api/admin/users", async c => {
  const user = c.get("user");
  if (!user || (!user.is_admin && !user.is_owner)) {
    return c.json({ success: false, error: "Forbidden" }, 403);
  }

  const users = await db.getAllUsers();
  return c.json({ success: true, users });
});

app.put("/api/admin/users/:username/role", async c => {
  const user = c.get("user");
  if (!user || (!user.is_admin && !user.is_owner)) {
    return c.json({ success: false, error: "Forbidden" }, 403);
  }

  const target = c.req.param("username");
  const { is_admin } = await c.req.json();

  const ok = await db.updateUserRole(target, !!is_admin);
  return c.json({ success: ok, message: ok ? "User role updated" : "Failed" });
});

app.delete("/api/admin/users/:username", async c => {
  const user = c.get("user");
  if (!user || (!user.is_admin && !user.is_owner)) {
    return c.json({ success: false, error: "Forbidden" }, 403);
  }

  const target = c.req.param("username");
  const ok = await db.deleteUser(target);
  return c.json({ success: ok, message: ok ? "User deleted" : "Failed" });
});

app.delete("/api/admin/comments/:id", async c => {
  const user = c.get("user");
  if (!user || (!user.is_admin && !user.is_owner)) {
    return c.json({ success: false, error: "Forbidden" }, 403);
  }

  const commentId = c.req.param("id");
  const ok = await db.deleteComment(commentId);
  return c.json({ success: ok, message: ok ? "Comment deleted" : "Failed" });
});


// --- MCP SERVER INTEGRATION (Streamable HTTP) ---

// Streamable HTTP: GET to confirm server capability
app.get("/mcp", c => {
  return c.json({ mcp: "streamable-http", version: "2025-03-26" });
});

// Streamable HTTP: single POST endpoint for all JSON-RPC messages
app.post("/mcp", async c => {
  try {
    const body = await c.req.json();

    // Try to retrieve API Token
    let token = "";
    const authHeader = c.req.header("Authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      token = c.req.header("X-API-Token") || "";
    }
    if (!token) {
      token = c.req.query("token") || c.req.query("api_token") || "";
    }
    if (!token && body) {
      const params = Array.isArray(body) ? body[0]?.params : body.params;
      if (params) {
        token = params.api_token || params.token || "";
      }
    }

    if (!token) {
      return c.json({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized: Missing API Token. Please generate an API Token in settings." },
        id: Array.isArray(body) ? (body[0]?.id || null) : (body?.id || null)
      }, 401);
    }

    const mcpUser = await db.getUserByApiToken(token);
    if (!mcpUser) {
      return c.json({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized: Invalid API Token." },
        id: Array.isArray(body) ? (body[0]?.id || null) : (body?.id || null)
      }, 401);
    }

    // Handle batch requests (array of JSON-RPC messages)
    if (Array.isArray(body)) {
      const results = await Promise.all(body.map(req => handleMcpRequest(req, mcpUser)));
      return c.json(results);
    }

    const result = await handleMcpRequest(body, mcpUser);

    // Notifications (no id) return 202 with no body
    if (result === null || result === undefined) {
      return new Response(null, { status: 202 });
    }

    return c.json(result);
  } catch (err: any) {
    return c.json({ jsonrpc: "2.0", error: { code: -32603, message: err.message }, id: null }, 500);
  }
});

export default app;
