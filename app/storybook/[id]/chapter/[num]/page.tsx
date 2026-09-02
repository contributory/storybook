import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import ChapterReaderView from "@/components/views/ChapterReaderView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; num: string }>;
}) {
  const { id, num } = await params;
  const [book, chapter] = await Promise.all([db.getStorybookById(id), db.getChapter(id, Number(num))]);
  if (book && chapter) return { title: `Chương ${num}: ${chapter.title} - ${book.title}` };
  return { title: "Chương" };
}

export default async function ChapterReaderPage({
  params,
}: {
  params: Promise<{ id: string; num: string }>;
}) {
  const { id: bookId, num: numParam } = await params;
  const num = Number(numParam);

  const user = await getSessionUser();
  const book = await db.getStorybookById(bookId);
  const chapter = await db.getChapter(bookId, num);
  if (!book || !chapter) redirect(`/storybook/${bookId}`);

  // Save reading progress
  if (user) {
    await db.saveReadingProgress(user.username, bookId, num);
  }

  // Get surrounding chapters for navigation
  const chaptersList = await db.getChaptersList(bookId);
  const curIndex = chaptersList.findIndex((ch) => ch.chapter_number === num);
  const prevNum = curIndex > 0 ? chaptersList[curIndex - 1].chapter_number : null;
  const nextNum = curIndex < chaptersList.length - 1 ? chaptersList[curIndex + 1].chapter_number : null;

  return <ChapterReaderView book={book} chapter={chapter} nextNum={nextNum} prevNum={prevNum} />;
}
