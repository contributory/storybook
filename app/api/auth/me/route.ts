import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";
import { ensureReady } from "@/lib/bootstrap";

export async function GET(req: Request) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, user: null });
  return NextResponse.json({
    success: true,
    user: {
      username: user.username,
      display_name: user.display_name,
      is_admin: user.is_admin,
      is_owner: user.is_owner,
    },
  });
}
