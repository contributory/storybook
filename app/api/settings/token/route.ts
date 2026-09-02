import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";

export async function POST(req: Request) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const rawToken = `sb_tok_${randomUUID().replace(/-/g, "")}`;
    const success = await db.updateUserApiToken(user.username, rawToken);
    return NextResponse.json({ success, token: rawToken });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
