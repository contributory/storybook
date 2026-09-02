import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import Homepage from "@/components/views/Homepage";

export const metadata = { title: "Trang Chủ" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const user = await getSessionUser();
  const booksResult = await db.getStorybooksPaginated(page, 12);
  const progress = user ? await db.getReadingProgress(user.username) : [];

  return <Homepage booksResult={booksResult} progress={progress} />;
}
