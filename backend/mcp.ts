import * as db from "./db.ts";

const BASE_URL = Deno.env.get("BASE_URL") || "http://localhost:8000";

export const MCP_TOOLS = [
  {
    name: "create_storybook_info",
    description: "Tạo một bộ truyện mới (Storybook) với các thông tin cơ bản.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID duy nhất cho bộ truyện (ví dụ: 'tay-du-ky')" },
        title: { type: "string", description: "Tiêu đề bộ truyện" },
        description: { type: "string", description: "Mô tả ngắn (tùy chọn, có thể bỏ trống)" },
        categories: { type: "string", description: "Thể loại (cách nhau bởi dấu phẩy, ví dụ: 'Tiên Hiệp, Huyền Huyễn')" },
        allow_other_author_edit: { type: "boolean", description: "Cho phép tác giả khác chỉnh sửa nội dung" },
        storyverse_id: { type: "string", description: "ID của vũ trụ cốt truyện (tùy chọn)" },
        characters: { type: "string", description: "Danh sách các nhân vật chính dưới dạng mảng JSON string, mỗi phần tử chứa {id: 'optional-shared-id', name: 'Tên', role: 'Vai trò', description: 'Mô tả'}. Ví dụ: '[{\"id\":\"ton-ngo-khong\",\"name\":\"Tôn Ngộ Không\",\"role\":\"Nhân vật chính\",\"description\":\"Tề Thiên Đại Thánh\"}]' (tùy chọn)" },
        ost: { type: "string", description: "Danh sách OST (bài hát/MV) của truyện dưới dạng mảng JSON string, mỗi phần tử có thể là chuỗi text/link hoặc {title, url}. Ví dụ: '[{\"title\":\"Tên bài hát\",\"url\":\"https://...\"}]' (tùy chọn, có thể bỏ trống)" }
      },
      required: ["id", "title", "categories", "allow_other_author_edit"]
    }
  },
  {
    name: "get_storybook_info",
    description: "Lấy thông tin tổng quan của một bộ truyện (không bao gồm nội dung chương).",
    inputSchema: {
      type: "object",
      properties: {
        storybook_id: { type: "string", description: "ID của bộ truyện" }
      },
      required: ["storybook_id"]
    }
  },
  {
    name: "get_storybooks",
    description: "Lấy danh sách bộ truyện (Storybook) với phân trang. Không bao gồm nội dung chương.",
    inputSchema: {
      type: "object",
      properties: {
        length: { type: "integer", description: "Số kết quả tối đa mỗi trang (mặc định 10, tối đa 50)" },
        page: { type: "integer", description: "Trang cần xem, bắt đầu từ 1 (mặc định 1)" },
        filter_by_user: { type: "string", description: "Chỉ lấy bộ truyện của tác giả này (username, tùy chọn)" }
      }
    }
  },
  {
    name: "search",
    description: "Tìm kiếm nội dung trên hệ thống theo từ khóa. Có thể lọc theo loại: all (tất cả), storybook (bộ truyện), storyverse (vũ trụ), user (người dùng), character (nhân vật).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Từ khóa tìm kiếm" },
        type: { type: "string", enum: ["all", "storybook", "storyverse", "user", "character"], description: "Loại đối tượng cần tìm (mặc định: all)" },
        limit: { type: "integer", description: "Số kết quả tối đa cho mỗi loại (mặc định 10, tối đa 50)" }
      },
      required: ["query"]
    }
  },
  {
    name: "create_or_edit_chapter",
    description: "Tạo chương mới hoặc cập nhật một chương đã có, bao gồm cả phần tóm tắt hỗ trợ AI.",
    inputSchema: {
      type: "object",
      properties: {
        storybook_id: { type: "string", description: "ID của bộ truyện" },
        chapter_number: { type: "integer", description: "Số chương (ví dụ: 1, 2, 3)" },
        title: { type: "string", description: "Tiêu đề chương" },
        content: { type: "string", description: "Nội dung chương (tùy chọn, có thể bỏ trống)" },
        summary: { type: "string", description: "Tóm tắt ngắn gọn của chương nhằm giúp AI viết tiếp mà không cần đọc lại toàn bộ (tùy chọn, có thể bỏ trống)" }
      },
      required: ["storybook_id", "chapter_number", "title"]
    }
  },
  {
    name: "get_storybook_chapter",
    description: "Lấy thông tin chi tiết một chương cụ thể của bộ truyện (gồm tiêu đề, tóm tắt, nội dung).",
    inputSchema: {
      type: "object",
      properties: {
        storybook_id: { type: "string", description: "ID của bộ truyện" },
        chapter_number: { type: "integer", description: "Số chương cụ thể" }
      },
      required: ["storybook_id", "chapter_number"]
    }
  },
  {
    name: "get_storyverse",
    description: "Lấy thông tin của một vũ trụ cốt truyện (Storyverse), bao gồm danh sách các bộ truyện liên quan.",
    inputSchema: {
      type: "object",
      properties: {
        storyverse_id: { type: "string", description: "ID của vũ trụ" }
      },
      required: ["storyverse_id"]
    }
  },
  {
    name: "get_storyverses",
    description: "Lấy danh sách vũ trụ cốt truyện (Storyverse) với phân trang.",
    inputSchema: {
      type: "object",
      properties: {
        length: { type: "integer", description: "Số kết quả tối đa mỗi trang (mặc định 10, tối đa 50)" },
        page: { type: "integer", description: "Trang cần xem, bắt đầu từ 1 (mặc định 1)" },
        filter_by_user: { type: "string", description: "Chỉ lấy vũ trụ của tác giả này (username, tùy chọn)" }
      }
    }
  },
  {
    name: "create_storyverse",
    description: "Tạo một vũ trụ cốt truyện (Storyverse) mới.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID duy nhất cho vũ trụ (ví dụ: 'mcu')" },
        title: { type: "string", description: "Tên vũ trụ cốt truyện" },
        description: { type: "string", description: "Mô tả chi tiết về thế giới, luật lệ trong vũ trụ (tùy chọn, có thể bỏ trống)" }
      },
      required: ["id", "title"]
    }
  },
  {
    name: "edit_storyverse_info",
    description: "Chỉnh sửa thông tin cơ bản của một vũ trụ cốt truyện.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID của vũ trụ cốt truyện" },
        title: { type: "string", description: "Tên mới" },
        description: { type: "string", description: "Mô tả mới" }
      },
      required: ["id", "title", "description"]
    }
  },
  {
    name: "create_character",
    description: "Tạo một nhân vật (Character) thuộc một vũ trụ cốt truyện.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID duy nhất của nhân vật" },
        name: { type: "string", description: "Tên nhân vật" },
        description: { type: "string", description: "Thông tin mô tả, ví dụ: ngoại hình, tính cách, kỹ năng (định dạng JSON hoặc Text)" },
        storyverse_id: { type: "string", description: "ID của vũ trụ cốt truyện mà nhân vật thuộc về" }
      },
      required: ["id", "name", "description", "storyverse_id"]
    }
  },
  {
    name: "get_character_by",
    description: "Lấy nhân vật (Character). Truyền character_id để lấy chi tiết 1 nhân vật, storyverse_id để lấy danh sách nhân vật trong một vũ trụ, hoặc để trống để lấy tất cả (có phân trang).",
    inputSchema: {
      type: "object",
      properties: {
        character_id: { type: "string", description: "ID của nhân vật cần lấy chi tiết (tùy chọn)" },
        storyverse_id: { type: "string", description: "ID vũ trụ để lấy danh sách nhân vật thuộc vũ trụ đó (tùy chọn)" },
        length: { type: "integer", description: "Số kết quả tối đa mỗi trang (mặc định 10, tối đa 50)" },
        page: { type: "integer", description: "Trang cần xem, bắt đầu từ 1 (mặc định 1)" },
        filter_by_user: { type: "string", description: "Chỉ lấy nhân vật của tác giả này (username, tùy chọn)" }
      }
    }
  },
  {
    name: "edit_character",
    description: "Chỉnh sửa thông tin một nhân vật (tên, mô tả, ảnh đại diện).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID của nhân vật" },
        name: { type: "string", description: "Tên mới (tùy chọn)" },
        description: { type: "string", description: "Mô tả mới (tùy chọn)" },
        thumbnail_url: { type: "string", description: "URL ảnh đại diện mới (tùy chọn)" }
      },
      required: ["id"]
    }
  },
  {
    name: "delete_storybook",
    description: "Xóa một bộ truyện cùng tất cả các chương liên quan.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID của bộ truyện cần xóa" }
      },
      required: ["id"]
    }
  },
  {
    name: "delete_chapter",
    description: "Xóa một chương cụ thể của bộ truyện.",
    inputSchema: {
      type: "object",
      properties: {
        storybook_id: { type: "string", description: "ID của bộ truyện" },
        chapter_number: { type: "integer", description: "Số chương cần xóa" }
      },
      required: ["storybook_id", "chapter_number"]
    }
  },
  {
    name: "delete_storyverse",
    description: "Xóa vũ trụ cốt truyện.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID của vũ trụ" }
      },
      required: ["id"]
    }
  },
  {
    name: "delete_character",
    description: "Xóa nhân vật.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID của nhân vật" }
      },
      required: ["id"]
    }
  },
  {
    name: "get_users_count",
    description: "Lấy tổng số lượng người dùng đã đăng ký trên hệ thống.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_user",
    description: "Lấy chi tiết thông tin một người dùng và các nội dung họ đã tạo.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username người dùng" }
      },
      required: ["username"]
    }
  },
  {
    name: "get_users",
    description: "Lấy danh sách người dùng với phân trang (không trả về mật khẩu / api token).",
    inputSchema: {
      type: "object",
      properties: {
        length: { type: "integer", description: "Số kết quả tối đa mỗi trang (mặc định 10, tối đa 50)" },
        page: { type: "integer", description: "Trang cần xem, bắt đầu từ 1 (mặc định 1)" },
        filter_by_user: { type: "string", description: "Lọc theo username (tùy chọn)" }
      }
    }
  },
  {
    name: "edit_user_role",
    description: "Cập nhật quyền admin cho người dùng.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username người dùng" },
        is_admin: { type: "boolean", description: "True để cấp quyền admin, False để gỡ" }
      },
      required: ["username", "is_admin"]
    }
  },
  {
    name: "create_user",
    description: "Tạo một tài khoản người dùng mới (yêu cầu quyền admin/owner).",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username mới (tối thiểu 3 ký tự)" },
        password: { type: "string", description: "Mật khẩu (tối thiểu 4 ký tự)" },
        display_name: { type: "string", description: "Tên hiển thị (tùy chọn, mặc định = username)" },
        is_admin: { type: "boolean", description: "Cấp quyền admin (mặc định false)" },
        des: { type: "string", description: "Giới thiệu ngắn về người dùng (tùy chọn, có thể bỏ trống)" },
        avatar: { type: "string", description: "URL ảnh đại diện (tùy chọn, có thể bỏ trống)" }
      },
      required: ["username", "password"]
    }
  },
  {
    name: "delete_user",
    description: "Xóa người dùng khỏi hệ thống (không áp dụng với Owner).",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username người dùng cần xóa" }
      },
      required: ["username"]
    }
  },
  {
    name: "delete_comment",
    description: "Xóa bình luận khỏi hệ thống.",
    inputSchema: {
      type: "object",
      properties: {
        comment_id: { type: "string", description: "ID bình luận" }
      },
      required: ["comment_id"]
    }
  },
  {
    name: "comment_to",
    description: "Gửi bình luận lên một thực thể (bộ truyện, vũ trụ, hoặc nhân vật). Hỗ trợ trả lời (reply_to) bình luận khác.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Nội dung bình luận" },
        target_type: { type: "string", enum: ["storybook", "storyverse", "character"], description: "Loại đối tượng nhận bình luận" },
        target_id: { type: "string", description: "ID của đối tượng nhận bình luận" },
        reply_to: { type: "string", description: "ID của bình luận được trả lời (tùy chọn)" }
      },
      required: ["content", "target_type", "target_id"]
    }
  },
  {
    name: "get_comments",
    description: "Lấy danh sách bình luận của một thực thể (bộ truyện, vũ trụ, hoặc nhân vật), bao gồm cả các phản hồi (replies) theo cấu trúc cây.",
    inputSchema: {
      type: "object",
      properties: {
        target_type: { type: "string", enum: ["storybook", "storyverse", "character"], description: "Loại đối tượng" },
        target_id: { type: "string", description: "ID của đối tượng" }
      },
      required: ["target_type", "target_id"]
    }
  },
  {
    name: "get_storybook_chapters_summaries",
    description: "Lấy tất cả các tóm tắt chương của một bộ truyện để nạp ngữ cảnh nhanh cho AI viết tiếp mà không cần đọc lại toàn bộ truyện.",
    inputSchema: {
      type: "object",
      properties: {
        storybook_id: { type: "string", description: "ID của bộ truyện" }
      },
      required: ["storybook_id"]
    }
  }
];

// Execute MCP Tool
const SENSITIVE_TOOLS = [
  "edit_user_role",
  "delete_user",
  "create_user",
  "delete_storybook",
  "delete_chapter",
  "delete_storyverse",
  "delete_character",
  "delete_comment"
];

// --- Helpers for list tools (pagination, filtering, password hashing) ---
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
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

export async function executeMcpTool(name: string, args: any, user: db.User): Promise<any> {
  if (SENSITIVE_TOOLS.includes(name)) {
    if (!user.is_admin && !user.is_owner) {
      return { success: false, error: "Forbidden: This tool requires owner or admin privileges." };
    }
  }
  try {
    switch (name) {
      case "create_storybook_info": {
        const { id, title, description = "", categories, allow_other_author_edit, storyverse_id, characters = "[]", ost = "[]" } = args;
        const res = await db.createStorybook(id, title, description, user.username, categories, allow_other_author_edit, storyverse_id || null, "", typeof characters === "string" ? characters : JSON.stringify(characters), typeof ost === "string" ? ost : JSON.stringify(ost));
        return { success: true, storybook: res, url: `${BASE_URL}/storybook/${id}` };
      }

      case "get_storybook_info": {
        const { storybook_id } = args;
        const book = await db.getStorybookById(storybook_id);
        if (!book) return { success: false, error: "Storybook not found" };
        return { success: true, storybook: book };
      }

      case "get_storybooks": {
        const length = clampLength(args.length);
        const page = clampPage(args.page);
        const filterByUser = args.filter_by_user ? String(args.filter_by_user).toLowerCase() : "";
        const all = await db.getAllStorybooks();
        const filtered = filterByUser ? all.filter(b => b.authors.toLowerCase().includes(filterByUser)) : all;
        const meta = paginate(filtered, length, page);
        return { success: true, storybooks: meta.items, count: meta.count, total: meta.total, page: meta.page, length: meta.length, total_pages: meta.total_pages, has_more: meta.has_more };
      }

      case "search": {
        const { query, type = "all", limit = 10 } = args;
        if (!query || !String(query).trim()) {
          return { success: false, error: "Missing query: vui lòng cung cấp từ khóa tìm kiếm" };
        }
        const q = String(query);
        const clampedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
        const validTypes = ["all", "storybook", "storyverse", "user", "character"];
        const t = validTypes.includes(type) ? type : "all";

        const results: Record<string, any[]> = {};
        if (t === "all" || t === "storybook") results.storybooks = await db.searchStorybooks(q, clampedLimit);
        if (t === "all" || t === "storyverse") results.storyverses = await db.searchStoryverses(q, clampedLimit);
        if (t === "all" || t === "user") results.users = await db.searchUsers(q, clampedLimit);
        if (t === "all" || t === "character") results.characters = await db.searchCharacters(q, clampedLimit);

        const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
        return { success: true, type: t, count: total, results };
      }

      case "create_or_edit_chapter": {
        const { storybook_id, chapter_number, title, content = "", summary = "" } = args;
        const res = await db.createOrEditChapter(storybook_id, chapter_number, title, content, summary);
        return { success: true, chapter: { ...res, content: "[Hidden Content in output]" }, url: `${BASE_URL}/storybook/${storybook_id}/chapter/${chapter_number}` };
      }

      case "get_storybook_chapter": {
        const { storybook_id, chapter_number } = args;
        const chapter = await db.getChapter(storybook_id, chapter_number);
        if (!chapter) return { success: false, error: "Chapter not found" };
        return { success: true, chapter };
      }

      case "get_storyverse": {
        const { storyverse_id } = args;
        const universe = await db.getStoryverseById(storyverse_id);
        if (!universe) return { success: false, error: "Storyverse not found" };
        return { success: true, storyverse: universe };
      }

      case "get_storyverses": {
        const length = clampLength(args.length);
        const page = clampPage(args.page);
        const filterByUser = args.filter_by_user ? String(args.filter_by_user).toLowerCase() : "";
        const all = await db.getAllStoryverses();
        const filtered = filterByUser ? all.filter(v => v.author.toLowerCase().includes(filterByUser)) : all;
        const meta = paginate(filtered, length, page);
        return { success: true, storyverses: meta.items, count: meta.count, total: meta.total, page: meta.page, length: meta.length, total_pages: meta.total_pages, has_more: meta.has_more };
      }

      case "create_storyverse": {
        const { id, title, description = "" } = args;
        const res = await db.createStoryverse(id, title, description, user.username);
        return { success: true, storyverse: res, url: `${BASE_URL}/storyverses/${id}` };
      }

      case "edit_storyverse_info": {
        const { id, title, description } = args;
        const success = await db.updateStoryverse(id, title, description);
        return { success, message: success ? "Storyverse updated" : "Failed to update Storyverse" };
      }

      case "create_character": {
        const { id, name: charName, description, storyverse_id } = args;
        const res = await db.createCharacter(id, charName, description, storyverse_id, user.username);
        return { success: true, character: res, url: `${BASE_URL}/storyverses/${storyverse_id}` };
      }

      case "get_character_by": {
        const length = clampLength(args.length);
        const page = clampPage(args.page);
        const filterByUser = args.filter_by_user ? String(args.filter_by_user).toLowerCase() : "";

        if (args.character_id) {
          const ch = await db.getCharacterById(args.character_id);
          if (!ch) return { success: false, error: "Character not found" };
          return { success: true, character: ch };
        }

        const list = args.storyverse_id
          ? await db.getCharactersByStoryverse(args.storyverse_id)
          : await db.getAllCharacters();
        const filtered = filterByUser ? list.filter(c => c.author.toLowerCase().includes(filterByUser)) : list;
        const meta = paginate(filtered, length, page);
        return { success: true, characters: meta.items, count: meta.count, total: meta.total, page: meta.page, length: meta.length, total_pages: meta.total_pages, has_more: meta.has_more };
      }

      case "edit_character": {
        const { id, name, description, thumbnail_url } = args;
        if (name === undefined && description === undefined && thumbnail_url === undefined) {
          return { success: false, error: "Provide at least one field to update: name, description, thumbnail_url" };
        }
        const existing = await db.getCharacterById(id);
        if (!existing) return { success: false, error: "Character not found" };
        const success = await db.updateCharacter(
          id,
          name !== undefined ? String(name) : existing.name,
          description !== undefined ? String(description) : existing.description,
          thumbnail_url !== undefined ? String(thumbnail_url) : undefined
        );
        return { success, message: success ? "Character updated" : "Failed to update character" };
      }

      case "delete_storybook": {
        const { id } = args;
        const success = await db.deleteStorybook(id);
        return { success, message: success ? "Storybook deleted" : "Failed to delete Storybook" };
      }

      case "delete_chapter": {
        const { storybook_id, chapter_number } = args;
        const success = await db.deleteChapter(storybook_id, chapter_number);
        return { success, message: success ? "Chapter deleted" : "Failed to delete chapter" };
      }

      case "delete_storyverse": {
        const { id } = args;
        const success = await db.deleteStoryverse(id);
        return { success, message: success ? "Storyverse deleted" : "Failed to delete storyverse" };
      }

      case "delete_character": {
        const { id } = args;
        const success = await db.deleteCharacter(id);
        return { success, message: success ? "Character deleted" : "Failed to delete character" };
      }

      case "get_users_count": {
        const count = await db.getUsersCount();
        return { success: true, count };
      }

      case "get_user": {
        const { username } = args;
        const user = await db.getUserByUsername(username);
        if (!user) return { success: false, error: "User not found" };

        // Fetch created content
        const allBooks = await db.getAllStorybooks();
        const createdBooks = allBooks.filter(b => b.authors.toLowerCase().includes(username.toLowerCase()));

        const allVerses = await db.getAllStoryverses();
        const createdVerses = allVerses.filter(v => v.author.toLowerCase() === username.toLowerCase());

        const followers = await db.getFollowers(username);
        const following = await db.getFollowing(username);

        return {
          success: true,
          user: {
            username: user.username,
            display_name: user.display_name,
            is_admin: user.is_admin,
            is_owner: user.is_owner,
            des: user.des || "",
            avatar: user.avatar || "",
            join_date: user.join_date,
            created_storybook: createdBooks.length,
            created_storyverse: createdVerses.length,
            followers_count: followers.length,
            following_count: following.length,
            followers,
            following,
            created_storybook_list: createdBooks,
            created_storyverse_list: createdVerses,
          }
        };
      }

      case "get_users": {
        const length = clampLength(args.length);
        const page = clampPage(args.page);
        const filterByUser = args.filter_by_user ? String(args.filter_by_user).toLowerCase() : "";
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
      }

      case "edit_user_role": {
        const { username, is_admin } = args;
        const success = await db.updateUserRole(username, is_admin);
        return { success, message: success ? "User role updated" : "Failed to update user role" };
      }

      case "create_user": {
        const { username, password, display_name, is_admin = false, des = "", avatar = "" } = args;
        if (!username || !password) return { success: false, error: "Missing username or password" };
        const cleanUsername = String(username).trim().toLowerCase();
        const pwd = String(password);
        if (cleanUsername.length < 3 || pwd.length < 4) {
          return { success: false, error: "Username must be >= 3 chars, password >= 4 chars" };
        }
        const existing = await db.getUserByUsername(cleanUsername);
        if (existing) return { success: false, error: "Username is already taken" };
        const pwdHash = await sha256(pwd);
        const newUser = await db.createUser(cleanUsername, String(display_name || cleanUsername).trim(), pwdHash, !!is_admin, false, des, avatar);
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
      }

      case "delete_user": {
        const { username } = args;
        const success = await db.deleteUser(username);
        return { success, message: success ? "User deleted" : "Failed to delete user" };
      }

      case "delete_comment": {
        const { comment_id } = args;
        const success = await db.deleteComment(comment_id);
        return { success, message: success ? "Comment deleted" : "Failed to delete comment" };
      }

      case "comment_to": {
        const { content, reply_to, target_type, target_id } = args;
        const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        // Keep author as the real username for FK integrity, but display the AI author name
        const res = await db.addComment(
          commentId,
          user.username,
          content,
          reply_to || null,
          target_type,
          target_id,
          user.ai_author_name || user.display_name
        );
        return { success: true, comment: res };
      }

      case "get_comments": {
        const { target_type, target_id } = args;
        const comments = await db.getCommentsForTarget(target_type, target_id);
        return { success: true, target_type, target_id, comments };
      }

      case "get_storybook_chapters_summaries": {
        const { storybook_id } = args;
        const list = await db.getChaptersList(storybook_id);
        const summaries = list.map(ch => ({
          chapter_number: ch.chapter_number,
          title: ch.title,
          summary: ch.summary
        }));
        return { success: true, storybook_id, chapters_summaries: summaries };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (error: any) {
    console.error(`Error executing MCP tool ${name}:`, error);
    return { success: false, error: error.message };
  }
}

// Handler for JSON-RPC (Streamable HTTP)
export async function handleMcpRequest(body: any, user: db.User): Promise<any> {
  const { jsonrpc, method, params, id } = body;

  if (jsonrpc !== "2.0") {
    return {
      jsonrpc: "2.0",
      error: { code: -32600, message: "Invalid Request" },
      id: id ?? null
    };
  }

  // Notifications have no id — process but return null (202 No Content)
  const isNotification = id === undefined;

  if (method === "initialize") {
    const response = {
      jsonrpc: "2.0",
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "storybook-mcp", version: "1.0.0" }
      },
      id
    };
    return isNotification ? null : response;
  }

  if (method === "tools/list") {
    const response = {
      jsonrpc: "2.0",
      result: { tools: MCP_TOOLS },
      id
    };
    return isNotification ? null : response;
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params || {};
    if (!name) {
      if (isNotification) return null;
      return {
        jsonrpc: "2.0",
        error: { code: -32602, message: "Invalid Params: missing tool name" },
        id
      };
    }

    const result = await executeMcpTool(name, args || {}, user);
    const response = {
      jsonrpc: "2.0",
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      },
      id
    };
    return isNotification ? null : response;
  }

  if (isNotification) return null;

  return {
    jsonrpc: "2.0",
    error: { code: -32601, message: "Method not found" },
    id
  };
}
