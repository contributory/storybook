import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";

type Params = { params: Promise<{ username: string }> };

export async function DELETE(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user || (!user.is_admin && !user.is_owner)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { username: target } = await params;
  const ok = await db.deleteUser(user.username, target);
  return NextResponse.json({ success: ok, message: ok ? "User deleted" : "Failed" });
}
