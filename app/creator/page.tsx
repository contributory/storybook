import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { creatorGate } from "@/lib/guards";
import CreatorPanel from "@/components/views/CreatorPanel";

export const metadata = { title: "Nhà Sáng Tạo" };

export default async function CreatorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();

  // Require login + "Nhà sáng tạo" permission
  const gate = creatorGate(user);
  if (gate || !user) redirect(gate ?? "/");

  const allBooks = await db.getAllStorybooks();
  // Allow creators to see books they auth, or any books that allow edits
  const books = allBooks.filter(
    (b) => b.authors.toLowerCase().includes(user.username.toLowerCase()) || b.allow_other_author_edit
  );
  const universes = await db.getAllStoryverses();
  const characters = await db.getAllCharacters();
  const prefillBookId = (typeof params.book_id === "string" && params.book_id) || "";

  return (
    <CreatorPanel books={books} universes={universes} characters={characters} user={user} prefillBookId={prefillBookId} />
  );
}
