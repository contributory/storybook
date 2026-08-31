import type { AppType } from "../middleware.js";
import * as db from "../db.js";
import * as ui from "../ui.js";
import { renderWithLayout, hasCreatorAccess } from "../middleware.js";

export function registerViewRoutes(app: AppType) {
  app.get("/", async c => {
    const user = c.get("user");
    const page = Number(c.req.query("page")) || 1;
    const booksResult = await db.getStorybooksPaginated(page, 12);
    const progress = user ? await db.getReadingProgress(user.username) : [];
    const rendered = ui.renderHomepage(booksResult, progress, user);
    return await renderWithLayout(c, "Trang Chủ", rendered, "/");
  });

  app.get("/storybooks", async c => {
    const user = c.get("user");
    const page = Number(c.req.query("page")) || 1;
    const booksResult = await db.getStorybooksPaginated(page, 12);
    const rendered = ui.renderStorybooksPage(booksResult, user);
    return await renderWithLayout(c, "Thư Viện Bộ Truyện", rendered, "/storybooks");
  });

  app.get("/storyverses", async c => {
    const user = c.get("user");
    const page = Number(c.req.query("page")) || 1;
    const versesResult = await db.getStoryversesPaginated(page, 12);
    const rendered = ui.renderStoryverses(versesResult, user);
    return await renderWithLayout(c, "Vũ Trụ Truyện", rendered, "/storyverses");
  });

  app.get("/characters", async c => {
    const user = c.get("user");
    const page = Number(c.req.query("page")) || 1;
    const charsResult = await db.getCharactersPaginated(page, 12);
    const universes = await db.getAllStoryverses();
    const rendered = ui.renderCharactersPage(charsResult, universes, user);
    return await renderWithLayout(c, "Nhân Vật Dùng Chung", rendered, "/characters");
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
    if (!hasCreatorAccess(user)) {
      return c.redirect("/settings"); // Restrict access to /creator if not creator
    }

    const allBooks = await db.getAllStorybooks();
    // Allow creators to see books they auth, or any books that allow edits
    const books = allBooks.filter(b => b.authors.toLowerCase().includes(user.username.toLowerCase()) || b.allow_other_author_edit);
    const universes = await db.getAllStoryverses();
    const characters = await db.getAllCharacters();

    const rendered = ui.renderCreatorPanel(books, universes, characters, user, c.req.query("book_id") || "");
    return await renderWithLayout(c, "Nhà Sáng Tạo", rendered, "/creator");
  });

  app.get("/create/storybook", async c => {
    const user = c.get("user");
    if (!user) return c.redirect("/");
    // Require creator permission to access the create page
    if (!hasCreatorAccess(user)) return c.redirect("/settings");

    const editId = (c.req.query("id") || "").trim();
    let book: db.Storybook | null = null;
    let chapters: Omit<db.Chapter, "content">[] = [];
    let editChapter: db.Chapter | null = null;

    if (editId) {
      book = await db.getStorybookById(editId);
      if (book) {
        const canEdit = book.authors.toLowerCase().includes(user.username.toLowerCase()) || user.is_admin || user.is_owner || book.allow_other_author_edit;
        if (!canEdit) return c.redirect(`/storybook/${book.id}`);

        chapters = await db.getChaptersList(book.id);
        const chNum = Number(c.req.query("chapter_number"));
        if (chNum) {
          editChapter = await db.getChapter(book.id, chNum);
        }
      }
    }

    const universes = await db.getAllStoryverses();
    const rendered = ui.renderCreateStorybook(universes, book, chapters, editChapter);
    return await renderWithLayout(c, book ? "Sửa Bộ Truyện" : "Tạo Bộ Truyện", rendered, "/creator");
  });

  app.get("/create/storyverse", async c => {
    const user = c.get("user");
    if (!user) return c.redirect("/");
    // Require creator permission to access the create page
    if (!hasCreatorAccess(user)) return c.redirect("/settings");

    const editId = (c.req.query("id") || "").trim();
    let sv: db.Storyverse | null = null;
    if (editId) {
      sv = await db.getStoryverseById(editId);
      if (sv && !(sv.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner)) {
        return c.redirect(`/storyverses/${sv.id}`);
      }
    }

    const rendered = ui.renderCreateStoryverse(sv);
    return await renderWithLayout(c, sv ? "Sửa Vũ Trụ" : "Tạo Vũ Trụ", rendered, "/creator");
  });

  app.get("/create/character", async c => {
    const user = c.get("user");
    if (!user) return c.redirect("/");
    // Require creator permission to access the create page
    if (!hasCreatorAccess(user)) return c.redirect("/settings");

    const editId = (c.req.query("id") || "").trim();
    let char: db.Character | null = null;
    if (editId) {
      char = await db.getCharacterById(editId);
      if (char && !(char.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner)) {
        return c.redirect(`/storyverses/${char.storyverse_id}`);
      }
    }

    const prefillSv = c.req.query("storyverse_id") || (char ? char.storyverse_id : "");
    const universes = await db.getAllStoryverses();
    const rendered = ui.renderCreateCharacter(universes, char, prefillSv);
    return await renderWithLayout(c, char ? "Sửa Nhân Vật" : "Tạo Nhân Vật", rendered, "/characters");
  });

  app.get("/admin", async c => {
    const user = c.get("user");
    if (!user || (!user.is_admin && !user.is_owner)) return c.redirect("/");

    const page = Number(c.req.query("page")) || 1;
    const users = await db.getUsersPaginated(page, 20);
    const rendered = ui.renderAdminPanel(users, user);
    return await renderWithLayout(c, "Quản Trị Hệ Thống", rendered, "/admin");
  });

  app.get("/search", async c => {
    const user = c.get("user");
    const q = (c.req.query("q") || "").trim();

    let books: db.Storybook[] = [];
    let universes: db.Storyverse[] = [];
    let characters: db.Character[] = [];
    let users: any[] = [];

    if (q) {
      books = await db.searchStorybooks(q, 15);
      universes = await db.searchStoryverses(q, 15);
      characters = await db.searchCharacters(q, 15);
      users = await db.searchUsers(q, 15);
    }

    const rendered = ui.renderSearchResults(q, books, universes, characters, users);
    return await renderWithLayout(c, `Tìm kiếm: "${q}"`, rendered);
  });
}
