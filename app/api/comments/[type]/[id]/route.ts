import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";

type Params = { params: Promise<{ type: string; id: string }> };

export async function GET(_req: Request, { params }: Params) {
  await ensureReady();
  const { type, id } = await params;
  const comments = await db.getCommentsForTarget(
    type as "storybook" | "storyverse" | "character",
    id
  );
  const res = NextResponse.json({ success: true, comments });
  res.headers.set("Cache-Control", "public, max-age=30");
  return res;
}
