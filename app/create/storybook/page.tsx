import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { creatorGate } from "@/lib/guards";
import CreateStorybookView from "@/components/views/CreateStorybookView";

export const metadata = { title: "Tạo Bộ Truyện" };

export default async function CreateStorybookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();

  // Require creator permission to access the create page
  const gate = creatorGate(user);
  if (gate || !user) redirect(gate ?? "/");

  const editId = (typeof params.id === "string" ? params.id : "").trim();
  let book: db.Storybook | null = null;
  let chapters: Omit<db.Chapter, "content">[] = [];
  let editChapter: db.Chapter | null = null;

  if (editId) {
    book = await db.getStorybookById(editId);
    if (book) {
      const canEdit =
        book.authors.toLowerCase().includes(user.username.toLowerCase()) ||
        user.is_admin ||
        user.is_owner ||
        book.allow_other_author_edit;
      if (!canEdit) redirect(`/storybook/${book.id}`);

      chapters = await db.getChaptersList(book.id);
      const chNum = Number(params.chapter_number) || 0;
      if (chNum) {
        editChapter = await db.getChapter(book.id, chNum);
      }
    }
  }

  const universes = await db.getAllStoryverses();

  return <CreateStorybookView universes={universes} book={book} chapters={chapters} editChapter={editChapter} />;
}
