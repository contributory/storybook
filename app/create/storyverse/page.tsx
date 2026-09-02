import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { creatorGate } from "@/lib/guards";
import CreateStoryverseView from "@/components/views/CreateStoryverseView";

export const metadata = { title: "Tạo Vũ Trụ" };

export default async function CreateStoryversePage({
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
  let sv: db.Storyverse | null = null;
  if (editId) {
    sv = await db.getStoryverseById(editId);
    if (sv && !(sv.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner)) {
      redirect(`/storyverses/${sv.id}`);
    }
  }

  return <CreateStoryverseView sv={sv} />;
}
