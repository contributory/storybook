import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import StoryversesView from "@/components/views/StoryversesView";

export const metadata = { title: "Vũ Trụ Truyện" };

export default async function StoryversesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const user = await getSessionUser();
  const versesResult = await db.getStoryversesPaginated(page, 12);

  return <StoryversesView versesResult={versesResult} user={user} />;
}
