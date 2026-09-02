import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import CharactersPageView from "@/components/views/CharactersPageView";

export const metadata = { title: "Nhân Vật Dùng Chung" };

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const user = await getSessionUser();
  const charsResult = await db.getCharactersPaginated(page, 12);
  const universes = await db.getAllStoryverses();

  return <CharactersPageView charsResult={charsResult} universes={universes} user={user} />;
}
