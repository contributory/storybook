import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// Mark a notification as read and redirect to its target (same as previous)
export async function GET(req: Request, { params }: Params) {
  await ensureReady();
  const { id } = await params;

  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.redirect(new URL("/", req.url), 302);

  await db.markNotificationAsRead(id);

  const res = await db.executeQuery("SELECT target_type, target_id FROM notifications WHERE id = ?", [id]);
  if (res.rows.length === 0) return NextResponse.redirect(new URL("/notifications", req.url), 302);

  const type = res.rows[0].target_type as string;
  const targetId = res.rows[0].target_id as string;

  if (type === "storybook") {
    return NextResponse.redirect(new URL(`/storybook/${targetId}`, req.url), 302);
  } else if (type === "storyverse") {
    return NextResponse.redirect(new URL(`/storyverses/${targetId}`, req.url), 302);
  } else if (type === "character") {
    const char = await db.getCharacterById(targetId);
    if (char) {
      return NextResponse.redirect(new URL(`/storyverses/${char.storyverse_id}`, req.url), 302);
    }
    return NextResponse.redirect(new URL("/storyverses", req.url), 302);
  }

  return NextResponse.redirect(new URL("/notifications", req.url), 302);
}
