import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user || (!user.is_admin && !user.is_owner)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id: commentId } = await params;
  const ok = await db.deleteComment(commentId);
  return NextResponse.json({ success: ok, message: ok ? "Comment deleted" : "Failed" });
}
