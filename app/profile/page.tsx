import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Hồ sơ" };

export default async function ProfileIndexPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  redirect(`/profile/${user.username}`);
}
