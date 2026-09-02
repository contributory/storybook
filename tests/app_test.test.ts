import { describe, it, expect, beforeAll } from "vitest";
import * as db from "../lib/db";
import { executeMcpTool, handleMcpRequest } from "../lib/mcp";
import { sha256 } from "../lib/session";
import { creatorGate } from "../lib/guards";
import { POST as registerPOST } from "../app/api/auth/register/route";
import { POST as createStorybookPOST } from "../app/api/storybooks/route";
import { POST as createStoryversePOST } from "../app/api/storyverses/route";
import { POST as createCharacterPOST } from "../app/api/characters/route";

describe("Storybook", () => {
  beforeAll(async () => { await db.initDb(); });

  it("Database Schema & CRUD Operations Test", async () => {
    await db.initDb();

    // 1. User Creation & Retrieval
    const username = `testuser_${Date.now()}`;
    const user = await db.createUser(username, "Test User", "hashedpassword", false, false);
    expect(user).toBeDefined();
    expect(user.username).toEqual(username);

    const retrievedUser = await db.getUserByUsername(username);
    expect(retrievedUser).toBeDefined();
    expect(retrievedUser!.display_name).toEqual("Test User");

    // 2. Storyverse Creation
    const svId = `universe_${Date.now()}`;
    const sv = await db.createStoryverse(svId, "Vũ Trụ Thử Nghiệm", "Mô tả vũ trụ thử nghiệm", username);
    expect(sv).toBeDefined();
    expect(sv.title).toEqual("Vũ Trụ Thử Nghiệm");

    const retrievedSv = await db.getStoryverseById(svId);
    expect(retrievedSv).toBeDefined();
    expect(retrievedSv!.description).toEqual("Mô tả vũ trụ thử nghiệm");

    // 3. Storybook Creation
    const bookId = `book_${Date.now()}`;
    const initialChars = '[{"id":"ton-ngo-khong","name":"Tôn Ngộ Không","role":"Main"}]';
    const book = await db.createStorybook(bookId, "Sách Thử Nghiệm", "Mô tả sách", username, "Hành Động, Phiêu Lưu", true, svId, "", initialChars);
    expect(book).toBeDefined();
    expect(book.title).toEqual("Sách Thử Nghiệm");
    expect(book.characters).toEqual(initialChars);

    const retrievedBook = await db.getStorybookById(bookId);
    expect(retrievedBook).toBeDefined();
    expect(retrievedBook!.characters).toEqual(initialChars);

    // Update characters
    const updatedChars = '[{"id":"duong-tang","name":"Đường Tăng","role":"Master"}]';
    await db.updateStorybook(bookId, book.title, book.description, book.categories, book.allow_other_author_edit, book.storyverse_id, undefined, updatedChars);
    const retrievedBook2 = await db.getStorybookById(bookId);
    expect(retrievedBook2).toBeDefined();
    expect(retrievedBook2!.characters).toEqual(updatedChars);

    // 4. Chapter Creation with custom AI Summary parameter!
    const chapter = await db.createOrEditChapter(bookId, 1, "Chương 1: Mở Đầu", "Đây là nội dung cực kỳ dài và hấp dẫn.", "Tóm tắt chương mở đầu cho AI");
    expect(chapter).toBeDefined();
    expect(chapter.summary).toEqual("Tóm tắt chương mở đầu cho AI");

    const retrievedCh = await db.getChapter(bookId, 1);
    expect(retrievedCh).toBeDefined();
    expect(retrievedCh!.title).toEqual("Chương 1: Mở Đầu");
    expect(retrievedCh!.summary).toEqual("Tóm tắt chương mở đầu cho AI");

    // 5. Follow Operations
    const follower = `follower_${Date.now()}`;
    await db.createUser(follower, "Follower", "pwd", false, false);
    const followOk = await db.followUser(follower, username);
    expect(followOk).toEqual(true);

    const followers = await db.getFollowers(username);
    expect(followers.includes(follower)).toEqual(true);
  });

  it("MCP Server Tools Dispatching Test", async () => {
    let testMcpUser = await db.getUserByUsername("mcp_test_user");
    if (!testMcpUser) {
      testMcpUser = await db.createUser("mcp_test_user", "MCP Test User", "pwd", true, true);
    }

    // 1. Test tools list schema retrieval
    const listResponse = await handleMcpRequest({
      jsonrpc: "2.0",
      method: "tools/list",
      id: 1
    }, testMcpUser);
    expect(listResponse.result).toBeDefined();
    expect(listResponse.result.tools).toBeDefined();
    expect(listResponse.result.tools.length > 10).toEqual(true);

    // 2. Test call tool for getting storybook chapters summaries (custom parameter)
    const bookId = `mcp_book_${Date.now()}`;
    await db.createStorybook(bookId, "MCP Book", "Des", "writer", "Fantasy", true, null);
    await db.createOrEditChapter(bookId, 1, "Chương Một", "Nội dung", "Tóm tắt một");
    await db.createOrEditChapter(bookId, 2, "Chương Hai", "Nội dung", "Tóm tắt hai");

    const callResponse = await handleMcpRequest({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "get_storybook_chapters_summaries",
        arguments: { storybook_id: bookId }
      },
      id: 2
    }, testMcpUser);

    expect(callResponse.result).toBeDefined();
    expect(callResponse.result.content).toBeDefined();

    const textOutput = JSON.parse(callResponse.result.content[0].text);
    expect(textOutput.success).toEqual(true);
    expect(textOutput.chapters_summaries.length).toEqual(2);
    expect(textOutput.chapters_summaries[0].summary).toEqual("Tóm tắt một");
  });

  it("MCP Storyverse/Character FK Fix Test", async () => {
    // Regression test for the FK constraint bug:
    // MCP tools previously inserted `user.ai_author_name || "AI"` as author,
    // which broke the FOREIGN KEY on users(username). They now use user.username.
    const username = `verse_user_${Date.now()}`;
    // admin=true (enough for sensitive tools), owner=false so cleanup deleteUser works
    const user = await db.createUser(username, "Verse Fix User", "pwd", true, false);
    // ai_author_name defaults to "" — exactly the scenario that used to fail
    expect(user.ai_author_name).toEqual("");

    // 1. create_storyverse via MCP handler must now succeed
    const verseId = `verse_${Date.now()}`;
    const verseRes = await executeMcpTool("create_storyverse", {
      id: verseId,
      title: "Verse FK Fix",
      description: "Regression: FK fix"
    }, user);
    expect(verseRes.success).toEqual(true);
    expect(verseRes.storyverse.author).toEqual(username);

    // 2. create_character via MCP handler must succeed
    const charId = `char_${Date.now()}`;
    const charRes = await executeMcpTool("create_character", {
      id: charId,
      name: "Hero FK Fix",
      description: "Test character",
      storyverse_id: verseId
    }, user);
    expect(charRes.success).toEqual(true);
    expect(charRes.character.author).toEqual(username);

    // 3. create_storybook_info author attribution fix (previously stored "AI")
    const bookId = `book_${Date.now()}`;
    const bookRes = await executeMcpTool("create_storybook_info", {
      id: bookId,
      title: "Book FK Fix",
      description: "Regression: author attribution",
      categories: "Test",
      allow_other_author_edit: true,
      storyverse_id: verseId
    }, user);
    expect(bookRes.success).toEqual(true);
    expect(bookRes.storybook.authors).toEqual(username);

    // 4. get_user now reports created content correctly (was 0 due to "AI" author)
    const userRes = await executeMcpTool("get_user", { username }, user);
    expect(userRes.success).toEqual(true);
    expect(userRes.user.created_storybook).toEqual(1);
    expect(userRes.user.created_storyverse).toEqual(1);

    // 5. get_storyverse returns the linked storybook
    const svRes = await executeMcpTool("get_storyverse", { storyverse_id: verseId }, user);
    expect(svRes.success).toEqual(true);
    expect(svRes.storyverse.storybook_list.length).toEqual(1);

    // Cleanup
    expect(await db.deleteCharacter(charId)).toEqual(true);
    expect(await db.deleteStorybook(bookId)).toEqual(true);
    expect(await db.deleteStoryverse(verseId)).toEqual(true);
    expect(await db.deleteUser(username, username)).toEqual(true);
  });

  it("MCP New List/Create/Edit Tools Test", async () => {
    // Admin (non-owner) user to exercise sensitive create_user + list tools
    const adminName = `admin_${Date.now()}`;
    const admin = await db.createUser(adminName, "Admin Tool User", "pwd", true, false);

    // 1. create_user via MCP (admin-only)
    const newName = `created_${Date.now()}`;
    const createUserRes = await executeMcpTool("create_user", {
      username: newName,
      password: "secret123",
      display_name: "Created Via MCP"
    }, admin);
    expect(createUserRes.success).toEqual(true);
    expect(createUserRes.user.username).toEqual(newName);
    expect(createUserRes.user.is_admin).toEqual(false);
    // password must be hashed, not plaintext
    const createdUser = await db.getUserByUsername(newName);
    expect(createdUser).toBeDefined();
    expect(createdUser!.password_hash).not.toEqual("secret123");

    // 2. Duplicate username should fail
    const dupRes = await executeMcpTool("create_user", { username: newName, password: "secret123" }, admin);
    expect(dupRes.success).toEqual(false);

    // 3. Non-admin cannot create_user
    const normalName = `normal_${Date.now()}`;
    const normal = await db.createUser(normalName, "Normal User", "pwd", false, false);
    const forbidden = await executeMcpTool("create_user", { username: `x_${Date.now()}`, password: "secret123" }, normal);
    expect(forbidden.success).toEqual(false);
    expect(forbidden.error.includes("Forbidden")).toBeTruthy();

    // 4. get_users with pagination + filter_by_user (sanitized output)
    const usersRes = await executeMcpTool("get_users", { length: 2, page: 1, filter_by_user: newName }, admin);
    expect(usersRes.success).toEqual(true);
    expect(usersRes.total).toEqual(1);
    expect(usersRes.users.length).toEqual(1);
    expect(usersRes.users[0].username).toEqual(newName);
    expect(usersRes.users[0].password_hash).toEqual(undefined);
    expect(usersRes.users[0].api_token).toEqual(undefined);

    // 5. Create storyverse + storybook + character via MCP for list tests
    const verseId = `list_verse_${Date.now()}`;
    const verseRes = await executeMcpTool("create_storyverse", { id: verseId, title: "List Verse", description: "d" }, admin);
    expect(verseRes.success).toEqual(true);

    const bookId = `list_book_${Date.now()}`;
    const bookRes = await executeMcpTool("create_storybook_info", { id: bookId, title: "List Book", description: "d", categories: "Test", allow_other_author_edit: false, storyverse_id: verseId }, admin);
    expect(bookRes.success).toEqual(true);

    const charId = `list_char_${Date.now()}`;
    const charRes = await executeMcpTool("create_character", { id: charId, name: "List Char", description: "info", storyverse_id: verseId }, admin);
    expect(charRes.success).toEqual(true);

    // 6. get_storybooks with filter_by_user
    const booksRes = await executeMcpTool("get_storybooks", { length: 5, page: 1, filter_by_user: adminName }, admin);
    expect(booksRes.success).toEqual(true);
    expect(booksRes.storybooks.some(b => b.id === bookId)).toBeTruthy();
    expect(booksRes.total >= 1).toBeTruthy();

    // 7. get_storyverses with filter_by_user
    const versesRes = await executeMcpTool("get_storyverses", { length: 5, page: 1, filter_by_user: adminName }, admin);
    expect(versesRes.success).toEqual(true);
    expect(versesRes.storyverses.some(v => v.id === verseId)).toBeTruthy();

    // 8. get_character_by: by id
    const byId = await executeMcpTool("get_character_by", { character_id: charId }, admin);
    expect(byId.success).toEqual(true);
    expect(byId.character.id).toEqual(charId);

    // 9. get_character_by: by storyverse (paginated list)
    const byVerse = await executeMcpTool("get_character_by", { storyverse_id: verseId, length: 10 }, admin);
    expect(byVerse.success).toEqual(true);
    expect(byVerse.characters.some(c => c.id === charId)).toBeTruthy();

    // 10. edit_character (partial update)
    const editRes = await executeMcpTool("edit_character", { id: charId, name: "Renamed Char", description: "new info" }, admin);
    expect(editRes.success).toEqual(true);
    const updatedChar = await db.getCharacterById(charId);
    expect(updatedChar).toBeDefined();
    expect(updatedChar!.name).toEqual("Renamed Char");
    expect(updatedChar!.description).toEqual("new info");

    // edit with no fields → error
    const noFields = await executeMcpTool("edit_character", { id: charId }, admin);
    expect(noFields.success).toEqual(false);

    // Cleanup
    expect(await db.deleteCharacter(charId)).toEqual(true);
    expect(await db.deleteStorybook(bookId)).toEqual(true);
    expect(await db.deleteStoryverse(verseId)).toEqual(true);
    expect(await db.deleteUser(adminName, newName)).toEqual(true);
    expect(await db.deleteUser(adminName, adminName)).toEqual(true);
    expect(await db.deleteUser(adminName, normalName)).toEqual(true);
  });

  it("Owner can edit/delete other owners (except env owner) Test", async () => {
    const envOwner = (process.env.OWNER_USERNAME || "owner").toLowerCase();
    const otherOwner = `other_owner_${Date.now()}`;
    const adminName = `owner_admin_${Date.now()}`;

    // Create a separate owner (is_admin + is_owner) and a plain admin
    await db.createUser(otherOwner, "Other Owner", "hashedpassword", true, true);
    await db.createUser(adminName, "Plain Admin", "hashedpassword", true, false);

    // Env owner can edit another owner's role
    expect(await db.updateUserRole(envOwner, otherOwner, false)).toEqual(true);
    // Non-env-owner admin cannot edit an owner
    expect(await db.updateUserRole(adminName, otherOwner, false)).toEqual(false);
    // No one can edit the env-var owner (including themselves)
    expect(await db.updateUserRole(envOwner, envOwner, true)).toEqual(false);

    // Non-env-owner admin cannot delete an owner
    expect(await db.deleteUser(adminName, otherOwner)).toEqual(false);
    // Env owner can delete another owner
    expect(await db.deleteUser(envOwner, otherOwner)).toEqual(true);
    // No one can delete the env-var owner (including themselves)
    expect(await db.deleteUser(envOwner, envOwner)).toEqual(false);

    // Cleanup
    expect(await db.deleteUser(envOwner, adminName)).toEqual(true);
  });

  it("MCP Optional Fields (des/avatar/ost, empty description/content) Test", async () => {
    const username = `opt_${Date.now()}`;
    const user = await db.createUser(username, "Opt User", "pwd", true, false);

    // 1. create_user with des + avatar via MCP
    const newName = `opt_created_${Date.now()}`;
    const createdRes = await executeMcpTool("create_user", {
      username: newName,
      password: "secret123",
      des: "Mô tả người dùng",
      avatar: "https://example.com/avatar.png"
    }, user);
    expect(createdRes.success).toEqual(true);
    expect(createdRes.user.des).toEqual("Mô tả người dùng");
    expect(createdRes.user.avatar).toEqual("https://example.com/avatar.png");
    const createdUser = await db.getUserByUsername(newName);
    expect(createdUser).toBeDefined();
    expect(createdUser!.des).toEqual("Mô tả người dùng");
    expect(createdUser!.avatar).toEqual("https://example.com/avatar.png");

    // 2. get_users returns des/avatar
    const usersRes = await executeMcpTool("get_users", { filter_by_user: newName }, user);
    expect(usersRes.success).toEqual(true);
    expect(usersRes.users[0].des).toEqual("Mô tả người dùng");
    expect(usersRes.users[0].avatar).toEqual("https://example.com/avatar.png");

    // 3. get_user returns des/avatar
    const userRes = await executeMcpTool("get_user", { username: newName }, user);
    expect(userRes.success).toEqual(true);
    expect(userRes.user.des).toEqual("Mô tả người dùng");
    expect(userRes.user.avatar).toEqual("https://example.com/avatar.png");

    // 4. create_storyverse WITHOUT description (empty allowed)
    const verseId = `opt_verse_${Date.now()}`;
    const verseRes = await executeMcpTool("create_storyverse", { id: verseId, title: "Opt Verse" }, user);
    expect(verseRes.success).toEqual(true);
    expect(verseRes.storyverse.description).toEqual("");

    // 5. create_storybook_info WITHOUT description + WITH ost
    const ost = '[{"title":"OST 1","url":"https://example.com/ost1"},{"title":"OST 2","url":"https://example.com/ost2"}]';
    const bookId = `opt_book_${Date.now()}`;
    const bookRes = await executeMcpTool("create_storybook_info", {
      id: bookId,
      title: "Opt Book",
      categories: "Test",
      allow_other_author_edit: false,
      ost
    }, user);
    expect(bookRes.success).toEqual(true);
    expect(bookRes.storybook.description).toEqual("");
    const savedBook = await db.getStorybookById(bookId);
    expect(savedBook).toBeDefined();
    expect(savedBook!.ost).toEqual(ost);

    // 6. create_or_edit_chapter WITHOUT content/summary (empty allowed)
    const chRes = await executeMcpTool("create_or_edit_chapter", {
      storybook_id: bookId,
      chapter_number: 1,
      title: "Chương trống"
    }, user);
    expect(chRes.success).toEqual(true);
    const ch = await db.getChapter(bookId, 1);
    expect(ch).toBeDefined();
    expect(ch!.content).toEqual("");
    expect(ch!.summary).toEqual("");

    // 7. get_storybooks returns ost
    const booksRes = await executeMcpTool("get_storybooks", { filter_by_user: username }, user);
    expect(booksRes.success).toEqual(true);
    const found = booksRes.storybooks.find(b => b.id === bookId);
    expect(found).toBeDefined();
    expect(found.ost).toEqual(ost);

    // 8. updateUserSettings preserves des/avatar (partial update path)
    const ok = await db.updateUserSettings(username, "Opt User 2", true, "AI Writer");
    expect(ok).toEqual(true);
    const updatedUser = await db.getUserByUsername(username);
    expect(updatedUser).toBeDefined();
    expect(updatedUser!.des).toEqual(""); // untouched when not provided);

    // Cleanup
    expect(await db.deleteStorybook(bookId)).toEqual(true);
    expect(await db.deleteStoryverse(verseId)).toEqual(true);
    expect(await db.deleteUser(username, newName)).toEqual(true);
    expect(await db.deleteUser(username, username)).toEqual(true);
  });

  it("Next.js Web App Authentication API Route Test", async () => {
    // Test registration API route (Route Handler invoked directly)
    const testUser = `api_user_${Date.now()}`;
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUser,
        password: "secretpassword123",
        display_name: "API Test User"
      })
    });

    const res = await registerPOST(req);
    expect(res.status).toEqual(200);

    const data = await res.json();
    expect(data.success).toEqual(true);
    expect(data.user.username).toEqual(testUser);
  });

  it("New Features: Settings, Notifications, and MCP Token Auth", async () => {
    // 1. Create a user and check default settings
    const username = `testsettings_${Date.now()}`;
    const user = await db.createUser(username, "Settings User", "pwd", false, false);
    expect(user).toBeDefined();
    expect(user.is_creator).toEqual(false); // defaults to false);
    expect(user.ai_author_name).toEqual("");

    // 2. Update settings
    const updateOk = await db.updateUserSettings(username, "New Display Name", true, "GPT-4o");
    expect(updateOk).toEqual(true);

    const updatedUser = await db.getUserByUsername(username);
    expect(updatedUser).toBeDefined();
    expect(updatedUser!.display_name).toEqual("New Display Name");
    expect(updatedUser!.is_creator).toEqual(true);
    expect(updatedUser!.ai_author_name).toEqual("GPT-4o");

    // 3. Update and retrieve by API token
    const token = `sb_tok_${Date.now()}`;
    const tokenOk = await db.updateUserApiToken(username, token);
    expect(tokenOk).toEqual(true);

    const retrievedByToken = await db.getUserByApiToken(token);
    expect(retrievedByToken).toBeDefined();
    expect(retrievedByToken!.username).toEqual(username);

    // 4. Create notification
    const sender = `sender_${Date.now()}`;
    await db.createUser(sender, "Sender User", "pwd", false, false);
    const notif = await db.createNotification(username, sender, "comment", "storybook", "some-book", "some-comment", "comment content");
    expect(notif).toBeDefined();
    expect(notif.is_read).toEqual(false);

    const count = await db.getUnreadNotificationsCount(username);
    expect(count).toEqual(1);

    const list = await db.getNotificationsForUser(username);
    expect(list.length).toEqual(1);
    expect(list[0].sender).toEqual(sender);

    // Mark as read
    const markOk = await db.markNotificationAsRead(notif.id);
    expect(markOk).toEqual(true);
    const newCount = await db.getUnreadNotificationsCount(username);
    expect(newCount).toEqual(0);
  });

  it("Creator Permission Enforcement on /create/* and Create APIs", async () => {
    // Build a valid session cookie so requests pass the auth middleware
    async function sessionCookie(u: db.User): Promise<string> {
      const APP_SECRET = process.env.APP_SECRET || "hono-deno-storybook-secret-key-123456";
      const sessionHash = await sha256(`${u.username}:${u.password_hash}:${APP_SECRET}`);
      return `user_username=${u.username}; user_session=${sessionHash}`;
    }

    const username = `creator_gate_${Date.now()}`;
    const user = await db.createUser(username, "Creator Gate User", "pwd", false, false);
    expect(user).toBeDefined();
    expect(user.is_creator).toEqual(false);
    const cookie = await sessionCookie(user);

    // 1. Non-creator cannot access /create/* pages (gated → redirect to /settings)
    for (const path of ["/create/storybook", "/create/storyverse", "/create/character"]) {
      const gate = creatorGate(user);
      expect(gate).toEqual("/settings");
      expect(path.startsWith("/create/")).toEqual(true);
    }

    // 1b. Logged-out users are sent home
    expect(creatorGate(null)).toEqual("/");

    // 2. Non-creator cannot create content via API (403)
    const bookPayload = { id: `gate_book_${Date.now()}`, title: "Gate Book", description: "d", categories: "Test", allow_other_author_edit: false };
    const bookRes = await createStorybookPOST(new Request("http://localhost/api/storybooks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(bookPayload)
    }));
    expect(bookRes.status).toEqual(403);

    const verseRes = await createStoryversePOST(new Request("http://localhost/api/storyverses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ id: `gate_verse_${Date.now()}`, title: "Gate Verse", description: "d" })
    }));
    expect(verseRes.status).toEqual(403);

    const charRes = await createCharacterPOST(new Request("http://localhost/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ id: `gate_char_${Date.now()}`, name: "Gate Char", description: "d", storyverse_id: "gate_verse_1" })
    }));
    expect(charRes.status).toEqual(403);

    // 3. Non-creator cannot create via MCP tools
    const mcpRes = await executeMcpTool("create_storybook_info", {
      id: `gate_mcp_book_${Date.now()}`,
      title: "Gate MCP Book",
      categories: "Test",
      allow_other_author_edit: false
    }, user);
    expect(mcpRes.success).toEqual(false);
    expect(mcpRes.error.includes("Forbidden")).toBeTruthy();

    // 4. After enabling creator permission, everything works
    await db.updateUserSettings(username, "Creator Gate User", true, "AI");
    const enabledUser = await db.getUserByUsername(username);
    expect(enabledUser).toBeDefined();
    expect(enabledUser!.is_creator).toEqual(true);

    // Page is now accessible (creator gate passes)
    expect(creatorGate(enabledUser)).toEqual(null);

    // API create now succeeds (200)
    const okBookId = `gate_book_ok_${Date.now()}`;
    const okBookRes = await createStorybookPOST(new Request("http://localhost/api/storybooks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ ...bookPayload, id: okBookId })
    }));
    expect(okBookRes.status).toEqual(200);
    const okData = await okBookRes.json();
    expect(okData.success).toEqual(true);

    // MCP create now works
    const okMcp = await executeMcpTool("create_storybook_info", {
      id: `gate_mcp_book_ok_${Date.now()}`,
      title: "Gate MCP Book OK",
      categories: "Test",
      allow_other_author_edit: false
    }, enabledUser!);
    expect(okMcp.success).toEqual(true);

    // Cleanup
    expect(await db.deleteStorybook(okBookId)).toEqual(true);
    expect(await db.deleteUser(username, username)).toEqual(true);
  });

});

