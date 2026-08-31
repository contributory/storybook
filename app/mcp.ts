import { createHash } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { z } from "zod";
import * as db from "./db.ts";

const BASE_URL = process.env.BASE_URL || "http://localhost:8000";

// Tools that require owner/admin privileges
const SENSITIVE_TOOLS = [
  "edit_user_role",
  "delete_user",
  "create_user",
  "delete_storybook",
  "delete_chapter",
  "delete_storyverse",
  "delete_character",
  "delete_comment",
];

// Tools that create new content — require the "Nhà sáng tạo" (creator) permission
// (admins and the owner always bypass this check)
const CREATOR_TOOLS = [
  "create_storybook_info",
  "create_storyverse",
  "create_character",
];

// Enforce access control per tool for the given (authenticated) user.
function guard(name: string, user: db.User): { success: false; error: string } | null {
  if (SENSITIVE_TOOLS.includes(name) && !user.is_admin && !user.is_owner) {
    return { success: false, error: "Forbidden: This tool requires owner or admin privileges." };
  }
  if (CREATOR_TOOLS.includes(name) && !user.is_creator && !user.is_admin && !user.is_owner) {
    return { success: false, error: "Forbidden: This tool requires the 'Nhà sáng tạo' (creator) permission. Enable it in your settings." };
  }
  return null;
}

// --- Helpers for list tools (pagination, filtering, password hashing) ---
async function sha256(message: string): Promise<string> {
  return createHash("sha256").update(message, "utf8").digest("hex");
}

function clampLength(v: any): number {
  const n = Number(v);
  if (Number.isNaN(n) || n <= 0) return 10;
  return Math.min(Math.floor(n), 50);
}

function clampPage(v: any): number {
  const n = Number(v);
  if (Number.isNaN(n) || n < 1) return 1;
  return Math.floor(n);
}

function paginate<T>(items: T[], length: number, page: number) {
  const total = items.length;
  const start = (page - 1) * length;
  const itemsSlice = items.slice(start, start + length);
  return {
    items: itemsSlice,
    count: itemsSlice.length,
    total,
    page,
    length,
    total_pages: total === 0 ? 0 : Math.ceil(total / length),
    has_more: start + itemsSlice.length < total,
  };
}

function textResult(obj: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] };
}

// Build a fresh (stateless) MCP server bound to the requesting user.
// Every HTTP request gets its own server + transport, so no session state
// is kept between calls.
export function buildMcpServer(user: db.User): McpServer {
  const server = new McpServer({ name: "storybook-mcp", version: "1.0.0" });

  const register = (
    name: string,
    description: string,
    schema: Record<string, z.ZodTypeAny>,
    handler: (args: any) => Promise<any>,
  ) => {
    server.tool(name, description, schema, async (args: any) => {
      const denied = guard(name, user);
      if (denied) return textResult(denied);
      try {
        return textResult(await handler(args));
      } catch (error: any) {
        console.error(`Error executing MCP tool ${name}:`, error);
        return { ...textResult({ success: false, error: error.message }), isError: true };
      }
    });
  };

  register(
    "create_storybook_info",
    "Tạo một bộ truyện mới (Storybook) với các thông tin cơ bản.",
    {
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      categories: z.string(),
      allow_other_author_edit: z.boolean(),
      storyverse_id: z.string().optional(),
      characters: z.string().optional(),
      ost: z.string().optional(),
    },
    async (a) => {
      const characters = a.characters ?? "[]";
      const ost = a.ost ?? "[]";
      const res = await db.createStorybook(
        a.id, a.title, a.description ?? "", user.username, a.categories,
        a.allow_other_author_edit, a.storyverse_id || null, "",
        typeof characters === "string" ? characters : JSON.stringify(characters),
        typeof ost === "string" ? ost : JSON.stringify(ost),
      );
      return { success: true, storybook: res, url: `${BASE_URL}/storybook/${a.id}` };
    },
  );

  register(
    "get_storybook_info",
    "Lấy thông tin tổng quan của một bộ truyện (không bao gồm nội dung chương).",
    { storybook_id: z.string() },
    async (a) => {
      const book = await db.getStorybookById(a.storybook_id);
      if (!book) return { success: false, error: "Storybook not found" };
      return { success: true, storybook: book };
    },
  );

  register(
    "get_storybooks",
    "Lấy danh sách bộ truyện (Storybook) với phân trang. Không bao gồm nội dung chương.",
    {
      length: z.number().int().optional(),
      page: z.number().int().optional(),
      filter_by_user: z.string().optional(),
    },
    async (a) => {
      const length = clampLength(a.length);
      const page = clampPage(a.page);
      const filterByUser = a.filter_by_user ? String(a.filter_by_user).toLowerCase() : "";
      const all = await db.getAllStorybooks();
      const filtered = filterByUser ? all.filter(b => b.authors.toLowerCase().includes(filterByUser)) : all;
      const meta = paginate(filtered, length, page);
      return { success: true, storybooks: meta.items, count: meta.count, total: meta.total, page: meta.page, length: meta.length, total_pages: meta.total_pages, has_more: meta.has_more };
    },
  );

  register(
    "search",
    "Tìm kiếm nội dung trên hệ thống theo từ khóa. Có thể lọc theo loại: all (tất cả), storybook (bộ truyện), storyverse (vũ trụ), user (người dùng), character (nhân vật).",
    {
      query: z.string(),
      type: z.enum(["all", "storybook", "storyverse", "user", "character"]).optional(),
      limit: z.number().int().optional(),
    },
    async (a) => {
      const query = a.query;
      if (!query || !String(query).trim()) {
        return { success: false, error: "Missing query: vui lòng cung cấp từ khóa tìm kiếm" };
      }
      const q = String(query);
      const clampedLimit = Math.min(Math.max(Number(a.limit) || 10, 1), 50);
      const validTypes = ["all", "storybook", "storyverse", "user", "character"];
      const t = validTypes.includes(a.type) ? a.type : "all";

      const results: Record<string, any[]> = {};
      if (t === "all" || t === "storybook") results.storybooks = await db.searchStorybooks(q, clampedLimit);
      if (t === "all" || t === "storyverse") results.storyverses = await db.searchStoryverses(q, clampedLimit);
      if (t === "all" || t === "user") results.users = await db.searchUsers(q, clampedLimit);
      if (t === "all" || t === "character") results.characters = await db.searchCharacters(q, clampedLimit);

      const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
      return { success: true, type: t, count: total, results };
    },
  );

  register(
    "create_or_edit_chapter",
    "Tạo chương mới hoặc cập nhật một chương đã có, bao gồm cả phần tóm tắt hỗ trợ AI.",
    {
      storybook_id: z.string(),
      chapter_number: z.number().int(),
      title: z.string(),
      content: z.string().optional(),
      summary: z.string().optional(),
    },
    async (a) => {
      const res = await db.createOrEditChapter(a.storybook_id, a.chapter_number, a.title, a.content ?? "", a.summary ?? "");
      return { success: true, chapter: { ...res, content: "[Hidden Content in output]" }, url: `${BASE_URL}/storybook/${a.storybook_id}/chapter/${a.chapter_number}` };
    },
  );

  register(
    "get_storybook_chapter",
    "Lấy thông tin chi tiết một chương cụ thể của bộ truyện (gồm tiêu đề, tóm tắt, nội dung).",
    {
      storybook_id: z.string(),
      chapter_number: z.number().int(),
    },
    async (a) => {
      const chapter = await db.getChapter(a.storybook_id, a.chapter_number);
      if (!chapter) return { success: false, error: "Chapter not found" };
      return { success: true, chapter };
    },
  );

  register(
    "get_storyverse",
    "Lấy thông tin của một vũ trụ cốt truyện (Storyverse), bao gồm danh sách các bộ truyện liên quan.",
    { storyverse_id: z.string() },
    async (a) => {
      const universe = await db.getStoryverseById(a.storyverse_id);
      if (!universe) return { success: false, error: "Storyverse not found" };
      return { success: true, storyverse: universe };
    },
  );

  register(
    "get_storyverses",
    "Lấy danh sách vũ trụ cốt truyện (Storyverse) với phân trang.",
    {
      length: z.number().int().optional(),
      page: z.number().int().optional(),
      filter_by_user: z.string().optional(),
    },
    async (a) => {
      const length = clampLength(a.length);
      const page = clampPage(a.page);
      const filterByUser = a.filter_by_user ? String(a.filter_by_user).toLowerCase() : "";
      const all = await db.getAllStoryverses();
      const filtered = filterByUser ? all.filter(v => v.author.toLowerCase().includes(filterByUser)) : all;
      const meta = paginate(filtered, length, page);
      return { success: true, storyverses: meta.items, count: meta.count, total: meta.total, page: meta.page, length: meta.length, total_pages: meta.total_pages, has_more: meta.has_more };
    },
  );

  register(
    "create_storyverse",
    "Tạo một vũ trụ cốt truyện (Storyverse) mới.",
    {
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
    },
    async (a) => {
      const res = await db.createStoryverse(a.id, a.title, a.description ?? "", user.username);
      return { success: true, storyverse: res, url: `${BASE_URL}/storyverses/${a.id}` };
    },
  );

  register(
    "edit_storyverse_info",
    "Chỉnh sửa thông tin cơ bản của một vũ trụ cốt truyện.",
    {
      id: z.string(),
      title: z.string(),
      description: z.string(),
    },
    async (a) => {
      const success = await db.updateStoryverse(a.id, a.title, a.description);
      return { success, message: success ? "Storyverse updated" : "Failed to update Storyverse" };
    },
  );

  register(
    "create_character",
    "Tạo một nhân vật (Character) thuộc một vũ trụ cốt truyện.",
    {
      id: z.string(),
      name: z.string(),
      description: z.string(),
      storyverse_id: z.string(),
    },
    async (a) => {
      const res = await db.createCharacter(a.id, a.name, a.description, a.storyverse_id, user.username);
      return { success: true, character: res, url: `${BASE_URL}/storyverses/${a.storyverse_id}` };
    },
  );

  register(
    "get_character_by",
    "Lấy nhân vật (Character). Truyền character_id để lấy chi tiết 1 nhân vật, storyverse_id để lấy danh sách nhân vật trong một vũ trụ, hoặc để trống để lấy tất cả (có phân trang).",
    {
      character_id: z.string().optional(),
      storyverse_id: z.string().optional(),
      length: z.number().int().optional(),
      page: z.number().int().optional(),
      filter_by_user: z.string().optional(),
    },
    async (a) => {
      const length = clampLength(a.length);
      const page = clampPage(a.page);
      const filterByUser = a.filter_by_user ? String(a.filter_by_user).toLowerCase() : "";

      if (a.character_id) {
        const ch = await db.getCharacterById(a.character_id);
        if (!ch) return { success: false, error: "Character not found" };
        return { success: true, character: ch };
      }

      const list = a.storyverse_id
        ? await db.getCharactersByStoryverse(a.storyverse_id)
        : await db.getAllCharacters();
      const filtered = filterByUser ? list.filter(c => c.author.toLowerCase().includes(filterByUser)) : list;
      const meta = paginate(filtered, length, page);
      return { success: true, characters: meta.items, count: meta.count, total: meta.total, page: meta.page, length: meta.length, total_pages: meta.total_pages, has_more: meta.has_more };
    },
  );

  register(
    "edit_character",
    "Chỉnh sửa thông tin một nhân vật (tên, mô tả, ảnh đại diện).",
    {
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      thumbnail_url: z.string().optional(),
    },
    async (a) => {
      if (a.name === undefined && a.description === undefined && a.thumbnail_url === undefined) {
        return { success: false, error: "Provide at least one field to update: name, description, thumbnail_url" };
      }
      const existing = await db.getCharacterById(a.id);
      if (!existing) return { success: false, error: "Character not found" };
      const success = await db.updateCharacter(
        a.id,
        a.name !== undefined ? String(a.name) : existing.name,
        a.description !== undefined ? String(a.description) : existing.description,
        a.thumbnail_url !== undefined ? String(a.thumbnail_url) : undefined,
      );
      return { success, message: success ? "Character updated" : "Failed to update character" };
    },
  );

  register(
    "delete_storybook",
    "Xóa một bộ truyện cùng tất cả các chương liên quan.",
    { id: z.string() },
    async (a) => {
      const success = await db.deleteStorybook(a.id);
      return { success, message: success ? "Storybook deleted" : "Failed to delete Storybook" };
    },
  );

  register(
    "delete_chapter",
    "Xóa một chương cụ thể của bộ truyện.",
    {
      storybook_id: z.string(),
      chapter_number: z.number().int(),
    },
    async (a) => {
      const success = await db.deleteChapter(a.storybook_id, a.chapter_number);
      return { success, message: success ? "Chapter deleted" : "Failed to delete chapter" };
    },
  );

  register(
    "delete_storyverse",
    "Xóa vũ trụ cốt truyện.",
    { id: z.string() },
    async (a) => {
      const success = await db.deleteStoryverse(a.id);
      return { success, message: success ? "Storyverse deleted" : "Failed to delete storyverse" };
    },
  );

  register(
    "delete_character",
    "Xóa nhân vật.",
    { id: z.string() },
    async (a) => {
      const success = await db.deleteCharacter(a.id);
      return { success, message: success ? "Character deleted" : "Failed to delete character" };
    },
  );

  register(
    "get_users_count",
    "Lấy tổng số lượng người dùng đã đăng ký trên hệ thống.",
    {},
    async () => {
      const count = await db.getUsersCount();
      return { success: true, count };
    },
  );

  register(
    "get_user",
    "Lấy chi tiết thông tin một người dùng và các nội dung họ đã tạo.",
    { username: z.string() },
    async (a) => {
      const username = a.username;
      const userRow = await db.getUserByUsername(username);
      if (!userRow) return { success: false, error: "User not found" };

      const allBooks = await db.getAllStorybooks();
      const createdBooks = allBooks.filter(b => b.authors.toLowerCase().includes(username.toLowerCase()));

      const allVerses = await db.getAllStoryverses();
      const createdVerses = allVerses.filter(v => v.author.toLowerCase() === username.toLowerCase());

      const followers = await db.getFollowers(username);
      const following = await db.getFollowing(username);

      return {
        success: true,
        user: {
          username: userRow.username,
          display_name: userRow.display_name,
          is_admin: userRow.is_admin,
          is_owner: userRow.is_owner,
          des: userRow.des || "",
          avatar: userRow.avatar || "",
          join_date: userRow.join_date,
          created_storybook: createdBooks.length,
          created_storyverse: createdVerses.length,
          followers_count: followers.length,
          following_count: following.length,
          followers,
          following,
          created_storybook_list: createdBooks,
          created_storyverse_list: createdVerses,
        },
      };
    },
  );

  register(
    "get_users",
    "Lấy danh sách người dùng với phân trang (không trả về mật khẩu / api token).",
    {
      length: z.number().int().optional(),
      page: z.number().int().optional(),
      filter_by_user: z.string().optional(),
    },
    async (a) => {
      const length = clampLength(a.length);
      const page = clampPage(a.page);
      const filterByUser = a.filter_by_user ? String(a.filter_by_user).toLowerCase() : "";
      const all = await db.getAllUsers();
      const filtered = filterByUser ? all.filter(u => u.username.toLowerCase().includes(filterByUser)) : all;
      const meta = paginate(filtered, length, page);
      const users = meta.items.map(u => ({
        username: u.username,
        display_name: u.display_name,
        is_admin: u.is_admin,
        is_owner: u.is_owner,
        is_creator: u.is_creator,
        ai_author_name: u.ai_author_name,
        des: u.des || "",
        avatar: u.avatar || "",
        join_date: u.join_date,
      }));
      return { success: true, users, count: meta.count, total: meta.total, page: meta.page, length: meta.length, total_pages: meta.total_pages, has_more: meta.has_more };
    },
  );

  register(
    "edit_user_role",
    "Cập nhật quyền admin cho người dùng.",
    {
      username: z.string(),
      is_admin: z.boolean(),
    },
    async (a) => {
      const success = await db.updateUserRole(user.username, a.username, a.is_admin);
      return { success, message: success ? "User role updated" : "Failed to update user role" };
    },
  );

  register(
    "create_user",
    "Tạo một tài khoản người dùng mới (yêu cầu quyền admin/owner).",
    {
      username: z.string(),
      password: z.string(),
      display_name: z.string().optional(),
      is_admin: z.boolean().optional(),
      des: z.string().optional(),
      avatar: z.string().optional(),
    },
    async (a) => {
      const username = a.username;
      const password = a.password;
      if (!username || !password) return { success: false, error: "Missing username or password" };
      const cleanUsername = String(username).trim().toLowerCase();
      const pwd = String(password);
      if (cleanUsername.length < 3 || pwd.length < 4) {
        return { success: false, error: "Username must be >= 3 chars, password >= 4 chars" };
      }
      const existing = await db.getUserByUsername(cleanUsername);
      if (existing) return { success: false, error: "Username is already taken" };
      const pwdHash = await sha256(pwd);
      const newUser = await db.createUser(
        cleanUsername, String(a.display_name || cleanUsername).trim(), pwdHash,
        !!a.is_admin, false, a.des ?? "", a.avatar ?? "",
      );
      return {
        success: true,
        user: {
          username: newUser.username,
          display_name: newUser.display_name,
          is_admin: newUser.is_admin,
          is_owner: newUser.is_owner,
          join_date: newUser.join_date,
          des: newUser.des,
          avatar: newUser.avatar,
        },
      };
    },
  );

  register(
    "delete_user",
    "Xóa người dùng khỏi hệ thống (owner trong biến môi trường có thể xóa các owner khác, trừ chính mình).",
    { username: z.string() },
    async (a) => {
      const success = await db.deleteUser(user.username, a.username);
      return { success, message: success ? "User deleted" : "Failed to delete user" };
    },
  );

  register(
    "delete_comment",
    "Xóa bình luận khỏi hệ thống.",
    { comment_id: z.string() },
    async (a) => {
      const success = await db.deleteComment(a.comment_id);
      return { success, message: success ? "Comment deleted" : "Failed to delete comment" };
    },
  );

  register(
    "comment_to",
    "Gửi bình luận lên một thực thể (bộ truyện, vũ trụ, hoặc nhân vật). Hỗ trợ trả lời (reply_to) bình luận khác.",
    {
      content: z.string(),
      target_type: z.enum(["storybook", "storyverse", "character"]),
      target_id: z.string(),
      reply_to: z.string().optional(),
    },
    async (a) => {
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      // Keep author as the real username for FK integrity, but display the AI author name
      const res = await db.addComment(
        commentId,
        user.username,
        a.content,
        a.reply_to || null,
        a.target_type,
        a.target_id,
        user.ai_author_name || user.display_name,
      );
      return { success: true, comment: res };
    },
  );

  register(
    "get_comments",
    "Lấy danh sách bình luận của một thực thể (bộ truyện, vũ trụ, hoặc nhân vật), bao gồm cả các phản hồi (replies) theo cấu trúc cây.",
    {
      target_type: z.enum(["storybook", "storyverse", "character"]),
      target_id: z.string(),
    },
    async (a) => {
      const comments = await db.getCommentsForTarget(a.target_type, a.target_id);
      return { success: true, target_type: a.target_type, target_id: a.target_id, comments };
    },
  );

  register(
    "get_storybook_chapters_summaries",
    "Lấy tất cả các tóm tắt chương của một bộ truyện để nạp ngữ cảnh nhanh cho AI viết tiếp mà không cần đọc lại toàn bộ truyện.",
    { storybook_id: z.string() },
    async (a) => {
      const list = await db.getChaptersList(a.storybook_id);
      const summaries = list.map(ch => ({
        chapter_number: ch.chapter_number,
        title: ch.title,
        summary: ch.summary,
      }));
      return { success: true, storybook_id: a.storybook_id, chapters_summaries: summaries };
    },
  );

  return server;
}

// Stateless Streamable HTTP handler (one transport + server per request).
export async function mcpHttpHandler(c: any, user: db.User): Promise<Response> {
  const transport = new StreamableHTTPTransport();
  const server = buildMcpServer(user);
  await server.connect(transport);
  const response = await transport.handleRequest(c);
  // Stateless transports may return undefined for notification-only requests.
  return response ?? new Response(null, { status: 202 });
}

// --- Backwards-compatible helpers (used by tests / direct dispatch) ---

async function connectClient(user: db.User): Promise<{ client: Client; close: () => Promise<void> }> {
  const server = buildMcpServer(user);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "storybook-test-client", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    close: async () => {
      try { await client.close(); } catch { /* noop */ }
      try { await server.close(); } catch { /* noop */ }
    },
  };
}

export async function executeMcpTool(name: string, args: any, user: db.User): Promise<any> {
  const { client, close } = await connectClient(user);
  try {
    const res = await client.callTool({ name, arguments: args ?? {} });
    const text = (res.content?.[0] as any)?.text;
    return text ? JSON.parse(text) : res;
  } finally {
    await close();
  }
}

// JSON-RPC envelope kept for backward compatibility (e.g. tests). The real HTTP
// deployment uses mcpHttpHandler above; this dispatches through the SDK client.
export async function handleMcpRequest(body: any, user: db.User): Promise<any> {
  const { jsonrpc, method, params, id } = body;
  const isNotification = id === undefined;

  if (jsonrpc !== "2.0") {
    return { jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request" }, id: id ?? null };
  }

  if (method === "initialize") {
    const response = {
      jsonrpc: "2.0",
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "storybook-mcp", version: "1.0.0" },
      },
      id,
    };
    return isNotification ? null : response;
  }

  if (method === "tools/list") {
    const { client, close } = await connectClient(user);
    try {
      const tools = await client.listTools();
      return isNotification ? null : { jsonrpc: "2.0", result: { tools: tools.tools }, id };
    } finally {
      await close();
    }
  }

  if (method === "tools/call") {
    const { name, arguments: toolArgs } = params || {};
    if (!name) {
      if (isNotification) return null;
      return { jsonrpc: "2.0", error: { code: -32602, message: "Invalid Params: missing tool name" }, id };
    }
    const result = await executeMcpTool(name, toolArgs || {}, user);
    const response = {
      jsonrpc: "2.0",
      result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
      id,
    };
    return isNotification ? null : response;
  }

  if (isNotification) return null;

  return { jsonrpc: "2.0", error: { code: -32601, message: "Method not found" }, id };
}
