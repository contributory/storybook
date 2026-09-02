import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import ProfilePageView from "@/components/views/ProfilePageView";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `Hồ sơ @${username.toLowerCase()}` };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ username: rawUsername }, sp] = await Promise.all([params, searchParams]);
  const targetUsername = rawUsername.toLowerCase();

  const currentUser = await getSessionUser();
  const profileUser = await db.getUserByUsername(targetUsername);
  if (!profileUser) redirect("/");

  const bp = Number(sp.bp) || 1;
  const vp = Number(sp.vp) || 1;
  const cp = Number(sp.cp) || 1;

  const books = await db.getStorybooksByAuthorPaginated(targetUsername, bp, 10);
  const verses = await db.getStoryversesByAuthorPaginated(targetUsername, vp, 10);
  const characters = await db.getCharactersByAuthorPaginated(targetUsername, cp, 10);

  const followers = await db.getFollowers(targetUsername);
  const following = await db.getFollowing(targetUsername);
  const isFollowing = currentUser ? followers.includes(currentUser.username) : false;

  return (
    <ProfilePageView
      profileUser={profileUser}
      isOwnProfile={currentUser ? currentUser.username === targetUsername : false}
      booksResult={books}
      versesResult={verses}
      charactersResult={characters}
      isFollowing={isFollowing}
      followers={followers}
      following={following}
      currentUser={currentUser}
    />
  );
}
