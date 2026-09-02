import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";

// --- S3 PROXY ---
export async function GET(req: Request) {
  await ensureReady();
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const obj = await db.getS3Object(key);
  if (!obj) return NextResponse.json({ error: "File not found" }, { status: 404 });

  return new Response(obj.body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
