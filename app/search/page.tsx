import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import SearchResultsView from "@/components/views/SearchResultsView";

export const metadata = { title: "Kết Quả Tìm Kiếm" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim();
  const user = await getSessionUser();

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

  return <SearchResultsView query={q} books={books} universes={universes} characters={characters} users={users} />;
}
