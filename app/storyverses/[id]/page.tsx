import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import StoryverseDetailView from "@/components/views/StoryverseDetailView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sv = await db.getStoryverseById(id);
  return { title: sv ? sv.title : "Storyverse" };
}

export default async function StoryverseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sv = await db.getStoryverseById(id);
  if (!sv) redirect("/");
  const chars = await db.getCharactersByStoryverse(sv.id);
  const user = await getSessionUser();

  return <StoryverseDetailView sv={sv} characters={chars} user={user} />;
}
