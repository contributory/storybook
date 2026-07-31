import * as db from "./db.ts";

export const MCP_TOOLS = [
  {
    name: "create_storybook_info",
    description: "Tạo một bộ truyện mới (Storybook) với các thông tin cơ bản.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID duy nhất cho bộ truyện (ví dụ: 'tay-du-ky')" },
        title: { type: "string", description: "Tiêu đề bộ truyện" },
        description: { type: "string", description: "Mô tả ngắn" },
        authors: { type: "string", description: "Tác giả (hoặc danh sách tác giả cách nhau bởi dấu phẩy)" },
        categories: { type: "string", description: "Thể loại (cách nhau bởi dấu phẩy, ví dụ: 'Tiên Hiệp, Huyền Huyễn')" },
        allow_other_author_edit: { type: "boolean", description: "Cho phép tác giả khác chỉnh sửa nội dung" },
        storyverse_id: { type: "string", description: "ID của vũ trụ cốt truyện (tùy chọn)" }
      },
      required: ["id", "title", "description", "authors", "categories", "allow_other_author_edit"]
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
    name: "create_or_edit_chapter",
    description: "Tạo chương mới hoặc cập nhật một chương đã có, bao gồm cả phần tóm tắt hỗ trợ AI.",
    inputSchema: {
      type: "object",
      properties: {
        storybook_id: { type: "string", description: "ID của bộ truyện" },
        chapter_number: { type: "integer", description: "Số chương (ví dụ: 1, 2, 3)" },
        title: { type: "string", description: "Tiêu đề chương" },
        content: { type: "string", description: "Nội dung chương" },
        summary: { type: "string", description: "Tóm tắt ngắn gọn của chương nhằm giúp AI viết tiếp mà không cần đọc lại toàn bộ" }
      },
      required: ["storybook_id", "chapter_number", "title", "content", "summary"]
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
    name: "create_storyverse",
    description: "Tạo một vũ trụ cốt truyện (Storyverse) mới.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID duy nhất cho vũ trụ (ví dụ: 'mcu')" },
        title: { type: "string", description: "Tên vũ trụ cốt truyện" },
        description: { type: "string", description: "Mô tả chi tiết về thế giới, luật lệ trong vũ trụ" },
        author: { type: "string", description: "Username của người tạo" }
      },
      required: ["id", "title", "description", "author"]
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
    name: "create_shared_character",
    description: "Tạo một nhân vật dùng chung (Shared Character) thuộc một vũ trụ cốt truyện.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID duy nhất của nhân vật" },
        name: { type: "string", description: "Tên nhân vật" },
        other_info: { type: "string", description: "Thông tin mô tả thêm, ví dụ: ngoại hình, tính cách, kỹ năng (định dạng JSON hoặc Text)" },
        storyverse_id: { type: "string", description: "ID của vũ trụ cốt truyện mà nhân vật thuộc về" },
        author: { type: "string", description: "Username của tác giả tạo nhân vật" }
      },
      required: ["id", "name", "other_info", "storyverse_id", "author"]
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
    name: "delete_shared_character",
    description: "Xóa nhân vật dùng chung.",
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
        author: { type: "string", description: "Username người bình luận" },
        content: { type: "string", description: "Nội dung bình luận" },
        target_type: { type: "string", enum: ["storybook", "storyverse", "character"], description: "Loại đối tượng nhận bình luận" },
        target_id: { type: "string", description: "ID của đối tượng nhận bình luận" },
        reply_to: { type: "string", description: "ID của bình luận được trả lời (tùy chọn)" }
      },
      required: ["author", "content", "target_type", "target_id"]
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
export async function executeMcpTool(name: string, args: any): Promise<any> {
  try {
    switch (name) {
      case "create_storybook_info": {
        const { id, title, description, authors, categories, allow_other_author_edit, storyverse_id } = args;
        const res = await db.createStorybook(id, title, description, authors, categories, allow_other_author_edit, storyverse_id || null);
        return { success: true, storybook: res };
      }

      case "get_storybook_info": {
        const { storybook_id } = args;
        const book = await db.getStorybookById(storybook_id);
        if (!book) return { success: false, error: "Storybook not found" };
        return { success: true, storybook: book };
      }

      case "create_or_edit_chapter": {
        const { storybook_id, chapter_number, title, content, summary } = args;
        const res = await db.createOrEditChapter(storybook_id, chapter_number, title, content, summary);
        return { success: true, chapter: { ...res, content: "[Hidden Content in output]" } };
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

      case "create_storyverse": {
        const { id, title, description, author } = args;
        const res = await db.createStoryverse(id, title, description, author);
        return { success: true, storyverse: res };
      }

      case "edit_storyverse_info": {
        const { id, title, description } = args;
        const success = await db.updateStoryverse(id, title, description);
        return { success, message: success ? "Storyverse updated" : "Failed to update Storyverse" };
      }

      case "create_shared_character": {
        const { id, name: charName, other_info, storyverse_id, author } = args;
        const res = await db.createSharedCharacter(id, charName, other_info, storyverse_id, author);
        return { success: true, character: res };
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

      case "delete_shared_character": {
        const { id } = args;
        const success = await db.deleteSharedCharacter(id);
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

      case "edit_user_role": {
        const { username, is_admin } = args;
        const success = await db.updateUserRole(username, is_admin);
        return { success, message: success ? "User role updated" : "Failed to update user role" };
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
        const { author, content, reply_to, target_type, target_id } = args;
        const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const res = await db.addComment(commentId, author, content, reply_to || null, target_type, target_id);
        return { success: true, comment: res };
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

// Handler for JSON-RPC
export async function handleMcpRequest(body: any): Promise<any> {
  const { jsonrpc, method, params, id } = body;

  if (jsonrpc !== "2.0") {
    return {
      jsonrpc: "2.0",
      error: { code: -32600, message: "Invalid Request" },
      id: id || null
    };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      result: { tools: MCP_TOOLS },
      id
    };
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params || {};
    if (!name) {
      return {
        jsonrpc: "2.0",
        error: { code: -32602, message: "Invalid Params: missing tool name" },
        id
      };
    }

    const result = await executeMcpTool(name, args || {});
    return {
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
  }

  return {
    jsonrpc: "2.0",
    error: { code: -32601, message: "Method not found" },
    id
  };
}
