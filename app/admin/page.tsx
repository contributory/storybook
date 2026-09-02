import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { adminGate } from "@/lib/guards";
import AdminPanel from "@/components/views/AdminPanel";

export const metadata = { title: "Quản Trị Hệ Thống" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const user = await getSessionUser();
  const gate = adminGate(user);
  if (gate || !user) redirect(gate ?? "/");

  const users = await db.getUsersPaginated(page, 20);
  const isEnvOwner = db.isEnvOwnerUsername(user.username.toLowerCase());

  return <AdminPanel usersResult={users} currentUser={user} isEnvOwner={isEnvOwner} />;
}
