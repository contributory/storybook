import { assertEquals, assertExists, assertNotEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import * as db from "../backend/db.ts";
import { executeMcpTool, handleMcpRequest } from "../backend/mcp.ts";
import app, { sha256 } from "../backend/app.ts";

// Initialize database schema once before running tests
Deno.test({
  name: "Database Schema & CRUD Operations Test",
  fn: async () => {
    await db.initDb();

    // 1. User Creation & Retrieval
    const username = `testuser_${Date.now()}`;
    const user = await db.createUser(username, "Test User", "hashedpassword", false, false);
    assertExists(user);
    assertEquals(user.username, username);

    const retrievedUser = await db.getUserByUsername(username);
    assertExists(retrievedUser);
    assertEquals(retrievedUser.display_name, "Test User");

    // 2. Storyverse Creation
    const svId = `universe_${Date.now()}`;
    const sv = await db.createStoryverse(svId, "Vũ Trụ Thử Nghiệm", "Mô tả vũ trụ thử nghiệm", username);
    assertExists(sv);
    assertEquals(sv.title, "Vũ Trụ Thử Nghiệm");

    const retrievedSv = await db.getStoryverseById(svId);
    assertExists(retrievedSv);
    assertEquals(retrievedSv.description, "Mô tả vũ trụ thử nghiệm");

    // 3. Storybook Creation
    const bookId = `book_${Date.now()}`;
    const initialChars = '[{"id":"ton-ngo-khong","name":"Tôn Ngộ Không","role":"Main"}]';
    const book = await db.createStorybook(bookId, "Sách Thử Nghiệm", "Mô tả sách", username, "Hành Động, Phiêu Lưu", true, svId, "", initialChars);
    assertExists(book);
    assertEquals(book.title, "Sách Thử Nghiệm");
    assertEquals(book.characters, initialChars);

    const retrievedBook = await db.getStorybookById(bookId);
    assertExists(retrievedBook);
    assertEquals(retrievedBook.characters, initialChars);

    // Update characters
    const updatedChars = '[{"id":"duong-tang","name":"Đường Tăng","role":"Master"}]';
    await db.updateStorybook(bookId, book.title, book.description, book.categories, book.allow_other_author_edit, book.storyverse_id, undefined, updatedChars);
    const retrievedBook2 = await db.getStorybookById(bookId);
    assertExists(retrievedBook2);
    assertEquals(retrievedBook2.characters, updatedChars);

    // 4. Chapter Creation with custom AI Summary parameter!
    const chapter = await db.createOrEditChapter(bookId, 1, "Chương 1: Mở Đầu", "Đây là nội dung cực kỳ dài và hấp dẫn.", "Tóm tắt chương mở đầu cho AI");
    assertExists(chapter);
    assertEquals(chapter.summary, "Tóm tắt chương mở đầu cho AI");

    const retrievedCh = await db.getChapter(bookId, 1);
    assertExists(retrievedCh);
    assertEquals(retrievedCh.title, "Chương 1: Mở Đầu");
    assertEquals(retrievedCh.summary, "Tóm tắt chương mở đầu cho AI");

    // 5. Follow Operations
    const follower = `follower_${Date.now()}`;
    await db.createUser(follower, "Follower", "pwd", false, false);
    const followOk = await db.followUser(follower, username);
    assertEquals(followOk, true);

    const followers = await db.getFollowers(username);
    assertEquals(followers.includes(follower), true);
  }
});

Deno.test({
  name: "MCP Server Tools Dispatching Test",
  fn: async () => {
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
    assertExists(listResponse.result);
    assertExists(listResponse.result.tools);
    assertEquals(listResponse.result.tools.length > 10, true);

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

    assertExists(callResponse.result);
    assertExists(callResponse.result.content);

    const textOutput = JSON.parse(callResponse.result.content[0].text);
    assertEquals(textOutput.success, true);
    assertEquals(textOutput.chapters_summaries.length, 2);
    assertEquals(textOutput.chapters_summaries[0].summary, "Tóm tắt một");
  }
});

Deno.test({
  name: "MCP Storyverse/Character FK Fix Test",
  fn: async () => {
    // Regression test for the FK constraint bug:
    // MCP tools previously inserted `user.ai_author_name || "AI"` as author,
    // which broke the FOREIGN KEY on users(username). They now use user.username.
    const username = `verse_user_${Date.now()}`;
    // admin=true (enough for sensitive tools), owner=false so cleanup deleteUser works
    const user = await db.createUser(username, "Verse Fix User", "pwd", true, false);
    // ai_author_name defaults to "" — exactly the scenario that used to fail
    assertEquals(user.ai_author_name, "");

    // 1. create_storyverse via MCP handler must now succeed
    const verseId = `verse_${Date.now()}`;
    const verseRes = await executeMcpTool("create_storyverse", {
      id: verseId,
      title: "Verse FK Fix",
      description: "Regression: FK fix"
    }, user);
    assertEquals(verseRes.success, true, `create_storyverse failed: ${JSON.stringify(verseRes)}`);
    assertEquals(verseRes.storyverse.author, username);

    // 2. create_character via MCP handler must succeed
    const charId = `char_${Date.now()}`;
    const charRes = await executeMcpTool("create_character", {
      id: charId,
      name: "Hero FK Fix",
      description: "Test character",
      storyverse_id: verseId
    }, user);
    assertEquals(charRes.success, true, `create_character failed: ${JSON.stringify(charRes)}`);
    assertEquals(charRes.character.author, username);

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
    assertEquals(bookRes.success, true, `create_storybook_info failed: ${JSON.stringify(bookRes)}`);
    assertEquals(bookRes.storybook.authors, username);

    // 4. get_user now reports created content correctly (was 0 due to "AI" author)
    const userRes = await executeMcpTool("get_user", { username }, user);
    assertEquals(userRes.success, true);
    assertEquals(userRes.user.created_storybook, 1);
    assertEquals(userRes.user.created_storyverse, 1);

    // 5. get_storyverse returns the linked storybook
    const svRes = await executeMcpTool("get_storyverse", { storyverse_id: verseId }, user);
    assertEquals(svRes.success, true);
    assertEquals(svRes.storyverse.storybook_list.length, 1);

    // Cleanup
    assertEquals(await db.deleteCharacter(charId), true);
    assertEquals(await db.deleteStorybook(bookId), true);
    assertEquals(await db.deleteStoryverse(verseId), true);
    assertEquals(await db.deleteUser(username, username), true);
  }
});

Deno.test({
  name: "MCP New List/Create/Edit Tools Test",
  fn: async () => {
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
    assertEquals(createUserRes.success, true, JSON.stringify(createUserRes));
    assertEquals(createUserRes.user.username, newName);
    assertEquals(createUserRes.user.is_admin, false);
    // password must be hashed, not plaintext
    const createdUser = await db.getUserByUsername(newName);
    assertExists(createdUser);
    assertNotEquals(createdUser.password_hash, "secret123");

    // 2. Duplicate username should fail
    const dupRes = await executeMcpTool("create_user", { username: newName, password: "secret123" }, admin);
    assertEquals(dupRes.success, false);

    // 3. Non-admin cannot create_user
    const normalName = `normal_${Date.now()}`;
    const normal = await db.createUser(normalName, "Normal User", "pwd", false, false);
    const forbidden = await executeMcpTool("create_user", { username: `x_${Date.now()}`, password: "secret123" }, normal);
    assertEquals(forbidden.success, false);
    assert(forbidden.error.includes("Forbidden"));

    // 4. get_users with pagination + filter_by_user (sanitized output)
    const usersRes = await executeMcpTool("get_users", { length: 2, page: 1, filter_by_user: newName }, admin);
    assertEquals(usersRes.success, true);
    assertEquals(usersRes.total, 1);
    assertEquals(usersRes.users.length, 1);
    assertEquals(usersRes.users[0].username, newName);
    assertEquals(usersRes.users[0].password_hash, undefined);
    assertEquals(usersRes.users[0].api_token, undefined);

    // 5. Create storyverse + storybook + character via MCP for list tests
    const verseId = `list_verse_${Date.now()}`;
    const verseRes = await executeMcpTool("create_storyverse", { id: verseId, title: "List Verse", description: "d" }, admin);
    assertEquals(verseRes.success, true, JSON.stringify(verseRes));

    const bookId = `list_book_${Date.now()}`;
    const bookRes = await executeMcpTool("create_storybook_info", { id: bookId, title: "List Book", description: "d", categories: "Test", allow_other_author_edit: false, storyverse_id: verseId }, admin);
    assertEquals(bookRes.success, true, JSON.stringify(bookRes));

    const charId = `list_char_${Date.now()}`;
    const charRes = await executeMcpTool("create_character", { id: charId, name: "List Char", description: "info", storyverse_id: verseId }, admin);
    assertEquals(charRes.success, true, JSON.stringify(charRes));

    // 6. get_storybooks with filter_by_user
    const booksRes = await executeMcpTool("get_storybooks", { length: 5, page: 1, filter_by_user: adminName }, admin);
    assertEquals(booksRes.success, true);
    assert(booksRes.storybooks.some(b => b.id === bookId));
    assert(booksRes.total >= 1);

    // 7. get_storyverses with filter_by_user
    const versesRes = await executeMcpTool("get_storyverses", { length: 5, page: 1, filter_by_user: adminName }, admin);
    assertEquals(versesRes.success, true);
    assert(versesRes.storyverses.some(v => v.id === verseId));

    // 8. get_character_by: by id
    const byId = await executeMcpTool("get_character_by", { character_id: charId }, admin);
    assertEquals(byId.success, true);
    assertEquals(byId.character.id, charId);

    // 9. get_character_by: by storyverse (paginated list)
    const byVerse = await executeMcpTool("get_character_by", { storyverse_id: verseId, length: 10 }, admin);
    assertEquals(byVerse.success, true);
    assert(byVerse.characters.some(c => c.id === charId));

    // 10. edit_character (partial update)
    const editRes = await executeMcpTool("edit_character", { id: charId, name: "Renamed Char", description: "new info" }, admin);
    assertEquals(editRes.success, true, JSON.stringify(editRes));
    const updatedChar = await db.getCharacterById(charId);
    assertExists(updatedChar);
    assertEquals(updatedChar.name, "Renamed Char");
    assertEquals(updatedChar.description, "new info");

    // edit with no fields → error
    const noFields = await executeMcpTool("edit_character", { id: charId }, admin);
    assertEquals(noFields.success, false);

    // Cleanup
    assertEquals(await db.deleteCharacter(charId), true);
    assertEquals(await db.deleteStorybook(bookId), true);
    assertEquals(await db.deleteStoryverse(verseId), true);
    assertEquals(await db.deleteUser(adminName, newName), true);
    assertEquals(await db.deleteUser(adminName, adminName), true);
    assertEquals(await db.deleteUser(adminName, normalName), true);
  }
});

Deno.test({
  name: "Owner can edit/delete other owners (except env owner) Test",
  fn: async () => {
    const envOwner = (Deno.env.get("OWNER_USERNAME") || "owner").toLowerCase();
    const otherOwner = `other_owner_${Date.now()}`;
    const adminName = `owner_admin_${Date.now()}`;

    // Create a separate owner (is_admin + is_owner) and a plain admin
    await db.createUser(otherOwner, "Other Owner", "hashedpassword", true, true);
    await db.createUser(adminName, "Plain Admin", "hashedpassword", true, false);

    // Env owner can edit another owner's role
    assertEquals(await db.updateUserRole(envOwner, otherOwner, false), true);
    // Non-env-owner admin cannot edit an owner
    assertEquals(await db.updateUserRole(adminName, otherOwner, false), false);
    // No one can edit the env-var owner (including themselves)
    assertEquals(await db.updateUserRole(envOwner, envOwner, true), false);

    // Non-env-owner admin cannot delete an owner
    assertEquals(await db.deleteUser(adminName, otherOwner), false);
    // Env owner can delete another owner
    assertEquals(await db.deleteUser(envOwner, otherOwner), true);
    // No one can delete the env-var owner (including themselves)
    assertEquals(await db.deleteUser(envOwner, envOwner), false);

    // Cleanup
    assertEquals(await db.deleteUser(envOwner, adminName), true);
  }
});

Deno.test({
  name: "MCP Optional Fields (des/avatar/ost, empty description/content) Test",
  fn: async () => {
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
    assertEquals(createdRes.success, true, JSON.stringify(createdRes));
    assertEquals(createdRes.user.des, "Mô tả người dùng");
    assertEquals(createdRes.user.avatar, "https://example.com/avatar.png");
    const createdUser = await db.getUserByUsername(newName);
    assertExists(createdUser);
    assertEquals(createdUser.des, "Mô tả người dùng");
    assertEquals(createdUser.avatar, "https://example.com/avatar.png");

    // 2. get_users returns des/avatar
    const usersRes = await executeMcpTool("get_users", { filter_by_user: newName }, user);
    assertEquals(usersRes.success, true);
    assertEquals(usersRes.users[0].des, "Mô tả người dùng");
    assertEquals(usersRes.users[0].avatar, "https://example.com/avatar.png");

    // 3. get_user returns des/avatar
    const userRes = await executeMcpTool("get_user", { username: newName }, user);
    assertEquals(userRes.success, true);
    assertEquals(userRes.user.des, "Mô tả người dùng");
    assertEquals(userRes.user.avatar, "https://example.com/avatar.png");

    // 4. create_storyverse WITHOUT description (empty allowed)
    const verseId = `opt_verse_${Date.now()}`;
    const verseRes = await executeMcpTool("create_storyverse", { id: verseId, title: "Opt Verse" }, user);
    assertEquals(verseRes.success, true, JSON.stringify(verseRes));
    assertEquals(verseRes.storyverse.description, "");

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
    assertEquals(bookRes.success, true, JSON.stringify(bookRes));
    assertEquals(bookRes.storybook.description, "");
    const savedBook = await db.getStorybookById(bookId);
    assertExists(savedBook);
    assertEquals(savedBook.ost, ost);

    // 6. create_or_edit_chapter WITHOUT content/summary (empty allowed)
    const chRes = await executeMcpTool("create_or_edit_chapter", {
      storybook_id: bookId,
      chapter_number: 1,
      title: "Chương trống"
    }, user);
    assertEquals(chRes.success, true, JSON.stringify(chRes));
    const ch = await db.getChapter(bookId, 1);
    assertExists(ch);
    assertEquals(ch.content, "");
    assertEquals(ch.summary, "");

    // 7. get_storybooks returns ost
    const booksRes = await executeMcpTool("get_storybooks", { filter_by_user: username }, user);
    assertEquals(booksRes.success, true);
    const found = booksRes.storybooks.find(b => b.id === bookId);
    assertExists(found);
    assertEquals(found.ost, ost);

    // 8. updateUserSettings preserves des/avatar (partial update path)
    const ok = await db.updateUserSettings(username, "Opt User 2", true, "AI Writer");
    assertEquals(ok, true);
    const updatedUser = await db.getUserByUsername(username);
    assertExists(updatedUser);
    assertEquals(updatedUser.des, ""); // untouched when not provided

    // Cleanup
    assertEquals(await db.deleteStorybook(bookId), true);
    assertEquals(await db.deleteStoryverse(verseId), true);
    assertEquals(await db.deleteUser(username, newName), true);
    assertEquals(await db.deleteUser(username, username), true);
  }
});

Deno.test({
  name: "Hono Web App Authentication API Route Test",
  fn: async () => {
    // Test registration API route
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

    const res = await app.request(req);
    assertEquals(res.status, 200);

    const data = await res.json();
    assertEquals(data.success, true);
    assertEquals(data.user.username, testUser);
  }
});


Deno.test({
  name: "New Features: Settings, Notifications, and MCP Token Auth",
  fn: async () => {
    // 1. Create a user and check default settings
    const username = `testsettings_${Date.now()}`;
    const user = await db.createUser(username, "Settings User", "pwd", false, false);
    assertExists(user);
    assertEquals(user.is_creator, false); // defaults to false
    assertEquals(user.ai_author_name, "");

    // 2. Update settings
    const updateOk = await db.updateUserSettings(username, "New Display Name", true, "GPT-4o");
    assertEquals(updateOk, true);

    const updatedUser = await db.getUserByUsername(username);
    assertExists(updatedUser);
    assertEquals(updatedUser.display_name, "New Display Name");
    assertEquals(updatedUser.is_creator, true);
    assertEquals(updatedUser.ai_author_name, "GPT-4o");

    // 3. Update and retrieve by API token
    const token = `sb_tok_${Date.now()}`;
    const tokenOk = await db.updateUserApiToken(username, token);
    assertEquals(tokenOk, true);

    const retrievedByToken = await db.getUserByApiToken(token);
    assertExists(retrievedByToken);
    assertEquals(retrievedByToken.username, username);

    // 4. Create notification
    const sender = `sender_${Date.now()}`;
    await db.createUser(sender, "Sender User", "pwd", false, false);
    const notif = await db.createNotification(username, sender, "comment", "storybook", "some-book", "some-comment", "comment content");
    assertExists(notif);
    assertEquals(notif.is_read, false);

    const count = await db.getUnreadNotificationsCount(username);
    assertEquals(count, 1);

    const list = await db.getNotificationsForUser(username);
    assertEquals(list.length, 1);
    assertEquals(list[0].sender, sender);

    // Mark as read
    const markOk = await db.markNotificationAsRead(notif.id);
    assertEquals(markOk, true);
    const newCount = await db.getUnreadNotificationsCount(username);
    assertEquals(newCount, 0);
  }
});

Deno.test({
  name: "Creator Permission Enforcement on /create/* and Create APIs",
  fn: async () => {
    // Build a valid session cookie so requests pass the auth middleware
    async function sessionCookie(u: db.User): Promise<string> {
      const APP_SECRET = Deno.env.get("APP_SECRET") || "hono-deno-storybook-secret-key-123456";
      const sessionHash = await sha256(`${u.username}:${u.password_hash}:${APP_SECRET}`);
      return `user_username=${u.username}; user_session=${sessionHash}`;
    }

    const username = `creator_gate_${Date.now()}`;
    const user = await db.createUser(username, "Creator Gate User", "pwd", false, false);
    assertExists(user);
    assertEquals(user.is_creator, false);
    const cookie = await sessionCookie(user);

    // 1. Non-creator cannot access /create/* pages (redirected to /settings)
    for (const path of ["/create/storybook", "/create/storyverse", "/create/character"]) {
      const res = await app.request(new Request(`http://localhost${path}`, {
        headers: { Cookie: cookie }
      }));
      assertEquals(res.status, 302, `${path} should redirect non-creators`);
      assertEquals(res.headers.get("location"), "/settings");
    }

    // 2. Non-creator cannot create content via API (403)
    const bookPayload = { id: `gate_book_${Date.now()}`, title: "Gate Book", description: "d", categories: "Test", allow_other_author_edit: false };
    const bookRes = await app.request(new Request("http://localhost/api/storybooks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(bookPayload)
    }));
    assertEquals(bookRes.status, 403, "POST /api/storybooks should be forbidden for non-creators");

    const verseRes = await app.request(new Request("http://localhost/api/storyverses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ id: `gate_verse_${Date.now()}`, title: "Gate Verse", description: "d" })
    }));
    assertEquals(verseRes.status, 403, "POST /api/storyverses should be forbidden for non-creators");

    const charRes = await app.request(new Request("http://localhost/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ id: `gate_char_${Date.now()}`, name: "Gate Char", description: "d", storyverse_id: "gate_verse_1" })
    }));
    assertEquals(charRes.status, 403, "POST /api/characters should be forbidden for non-creators");

    // 3. Non-creator cannot create via MCP tools
    const mcpRes = await executeMcpTool("create_storybook_info", {
      id: `gate_mcp_book_${Date.now()}`,
      title: "Gate MCP Book",
      categories: "Test",
      allow_other_author_edit: false
    }, user);
    assertEquals(mcpRes.success, false);
    assert(mcpRes.error.includes("Forbidden"));

    // 4. After enabling creator permission, everything works
    await db.updateUserSettings(username, "Creator Gate User", true, "AI");
    const enabledUser = await db.getUserByUsername(username);
    assertExists(enabledUser);
    assertEquals(enabledUser!.is_creator, true);

    // Page is now accessible (200)
    const pageRes = await app.request(new Request("http://localhost/create/storybook", {
      headers: { Cookie: cookie }
    }));
    assertEquals(pageRes.status, 200, "Creator should be able to open /create/storybook");

    // API create now succeeds (200)
    const okBookId = `gate_book_ok_${Date.now()}`;
    const okBookRes = await app.request(new Request("http://localhost/api/storybooks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ ...bookPayload, id: okBookId })
    }));
    assertEquals(okBookRes.status, 200, "Creator should be able to create a storybook");
    const okData = await okBookRes.json();
    assertEquals(okData.success, true);

    // MCP create now works
    const okMcp = await executeMcpTool("create_storybook_info", {
      id: `gate_mcp_book_ok_${Date.now()}`,
      title: "Gate MCP Book OK",
      categories: "Test",
      allow_other_author_edit: false
    }, enabledUser);
    assertEquals(okMcp.success, true);

    // Cleanup
    assertEquals(await db.deleteStorybook(okBookId), true);
    assertEquals(await db.deleteUser(username, username), true);
  }
});
