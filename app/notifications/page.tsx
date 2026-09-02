import { redirect } from "next/navigation";
import * as db from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import NotificationsPageView from "@/components/views/NotificationsPageView";

export const metadata = { title: "Thông báo của bạn" };

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const user = await getSessionUser();
  if (!user) redirect("/");

  const list = await db.getNotificationsPaginated(user.username, page, 15);

  return <NotificationsPageView notifsResult={list} />;
}
