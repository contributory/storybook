import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";

export async function GET(req: Request) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user || (!user.is_admin && !user.is_owner)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const users = await db.getAllUsers();
  return NextResponse.json({ success: true, users });
}
