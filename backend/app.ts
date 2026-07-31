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


// --- FRONTEND VIEWS ROUTING ---

app.get("/", async c => {
  const user = c.get("user");
  const books = await db.getAllStorybooks();
  const progress = user ? await db.getReadingProgress(user.username) : [];
  const rendered = ui.renderHomepage(books, progress, user);
  const htmlContent = ui.layout("Trang Chủ", rendered, user, "/");
  return c.html(htmlContent);
});

app.get("/storyverses", async c => {
  const user = c.get("user");
  const verses = await db.getAllStoryverses();
  const rendered = ui.renderStoryverses(verses);
  const htmlContent = ui.layout("Vũ Trụ Truyện", rendered, user, "/storyverses");
  return c.html(htmlContent);
});

app.get("/storyverses/:id", async c => {
  const user = c.get("user");
  const sv = await db.getStoryverseById(c.req.param("id"));
  if (!sv) return c.redirect("/");
  const chars = await db.getCharactersByStoryverse(sv.id);
  const rendered = ui.renderStoryverseDetail(sv, chars);
  const htmlContent = ui.layout(sv.title, rendered, user, `/storyverses`);
  return c.html(htmlContent);
});

app.get("/storybook/:id", async c => {
  const user = c.get("user");
  const book = await db.getStorybookById(c.req.param("id"));
  if (!book) return c.redirect("/");
  const chapters = await db.getChaptersList(book.id);
  const rendered = ui.renderStorybookDetail(book, chapters, user);
  const htmlContent = ui.layout(book.title, rendered, user, `/`);
  return c.html(htmlContent);
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
  const htmlContent = ui.layout(`Chương ${num}: ${chapter.title} - ${book.title}`, rendered, user, `/`);
  return c.html(htmlContent);
});

app.get("/creator", async c => {
  const user = c.get("user");
  if (!user) return c.redirect("/"); // Require login

  const allBooks = await db.getAllStorybooks();
  // Allow creators to see books they auth, or any books that allow edits
  const books = allBooks.filter(b => b.authors.toLowerCase().includes(user.username.toLowerCase()) || b.allow_other_author_edit);
  const universes = await db.getAllStoryverses();

  const rendered = ui.renderCreatorPanel(books, universes, c.req.query("book_id") || "");
  const htmlContent = ui.layout("Nhà Sáng Tạo", rendered, user, "/creator");
  return c.html(htmlContent);
});

app.get("/admin", async c => {
  const user = c.get("user");
  if (!user || (!user.is_admin && !user.is_owner)) return c.redirect("/");

  const users = await db.getAllUsers();
  const rendered = ui.renderAdminPanel(users);
  const htmlContent = ui.layout("Quản Trị Hệ Thống", rendered, user, "/admin");
  return c.html(htmlContent);
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
    const { id, title, description, categories, allow_other_author_edit, storyverse_id } = await c.req.json();
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
      storyverse_id || null
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
    const { title, description, categories, allow_other_author_edit, storyverse_id } = await c.req.json();
    const updated = await db.updateStorybook(
      bookId,
      title || book.title,
      description || book.description,
      categories || book.categories,
      allow_other_author_edit !== undefined ? !!allow_other_author_edit : book.allow_other_author_edit,
      storyverse_id !== undefined ? (storyverse_id || null) : book.storyverse_id
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


// --- MCP SERVER INTEGRATION (JSON-RPC + SSE) ---

// Direct endpoint
app.post("/api/mcp", async c => {
  try {
    const body = await c.req.json();
    const result = await handleMcpRequest(body);
    return c.json(result);
  } catch (err: any) {
    return c.json({ jsonrpc: "2.0", error: { code: -32603, message: err.message }, id: null });
  }
});

// SSE endpoint to standard MCP client compatibility
app.get("/mcp/sse", async c => {
  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");

  // SSE protocol: keep connection open, write SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Keep alive timer
  const keepAlive = setInterval(async () => {
    try {
      await writer.write(encoder.encode(": keep-alive\n\n"));
    } catch {
      clearInterval(keepAlive);
    }
  }, 15000);

  // Send initial standard MCP SSE endpoint announcement
  setTimeout(async () => {
    try {
      await writer.write(
        encoder.encode(`event: endpoint\ndata: /mcp/message\n\n`)
      );
    } catch {
      clearInterval(keepAlive);
    }
  }, 100);

  c.req.raw.signal.addEventListener("abort", () => {
    clearInterval(keepAlive);
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});

app.post("/mcp/message", async c => {
  try {
    const body = await c.req.json();
    const result = await handleMcpRequest(body);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
