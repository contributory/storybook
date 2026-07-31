import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import * as db from "../backend/db.ts";
import { executeMcpTool, handleMcpRequest } from "../backend/mcp.ts";
import app from "../backend/app.ts";

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
    const book = await db.createStorybook(bookId, "Sách Thử Nghiệm", "Mô tả sách", username, "Hành Động, Phiêu Lưu", true, svId);
    assertExists(book);
    assertEquals(book.title, "Sách Thử Nghiệm");

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
    // 1. Test tools list schema retrieval
    const listResponse = await handleMcpRequest({
      jsonrpc: "2.0",
      method: "tools/list",
      id: 1
    });
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
    });

    assertExists(callResponse.result);
    assertExists(callResponse.result.content);

    const textOutput = JSON.parse(callResponse.result.content[0].text);
    assertEquals(textOutput.success, true);
    assertEquals(textOutput.chapters_summaries.length, 2);
    assertEquals(textOutput.chapters_summaries[0].summary, "Tóm tắt một");
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
