import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { creatorGate } from "@/lib/guards";
import CreateCharacterView from "@/components/views/CreateCharacterView";

export const metadata = { title: "Tạo Nhân Vật" };

export default async function CreateCharacterPage({
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
  let char: db.Character | null = null;
  if (editId) {
    char = await db.getCharacterById(editId);
    if (char && !(char.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner)) {
      redirect(`/storyverses/${char.storyverse_id}`);
    }
  }

  const prefillSv =
    (typeof params.storyverse_id === "string" && params.storyverse_id) || (char ? char.storyverse_id : "");
  const universes = await db.getAllStoryverses();

  return <CreateCharacterView universes={universes} char={char} prefillStoryverseId={prefillSv} />;
}
