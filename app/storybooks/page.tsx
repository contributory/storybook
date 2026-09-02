import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import StorybooksPageView from "@/components/views/StorybooksPageView";

export const metadata = { title: "Thư Viện Bộ Truyện" };

export default async function StorybooksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const user = await getSessionUser();
  const booksResult = await db.getStorybooksPaginated(page, 12);

  return <StorybooksPageView booksResult={booksResult} user={user} />;
}
