import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import StorybookDetailView from "@/components/views/StorybookDetailView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await db.getStorybookById(id);
  return { title: book ? book.title : "Storybook" };
}

export default async function StorybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const book = await db.getStorybookById(id);
  if (!book) redirect("/");
  const chapters = await db.getChaptersList(book.id);

  return <StorybookDetailView book={book} chapters={chapters} user={user} />;
}
