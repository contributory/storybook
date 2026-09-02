import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  await ensureReady();
  const { id } = await params;
  const universe = await db.getStoryverseById(id);
  if (!universe) return jsonError("Storyverse not found", 404);

  // Fetch shared characters in this storyverse
  const characters = await db.getCharactersByStoryverse(universe.id);

  const res = NextResponse.json({ success: true, storyverse: universe, characters });
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
}

export async function PUT(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { id: universeId } = await params;
  const universe = await db.getStoryverseById(universeId);
  if (!universe) return jsonError("Storyverse not found", 404);

  const canEdit =
    universe.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
  if (!canEdit) return jsonError("Forbidden", 403);

  try {
    const { title, description } = await req.json();
    const success = await db.updateStoryverse(
      universeId,
      title || universe.title,
      description || universe.description
    );
    return NextResponse.json({ success, message: success ? "Storyverse updated" : "Failed" });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { id: universeId } = await params;
  const universe = await db.getStoryverseById(universeId);
  if (!universe) return jsonError("Storyverse not found", 404);

  const canDelete =
    universe.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
  if (!canDelete) return jsonError("Forbidden", 403);

  const success = await db.deleteStoryverse(universeId);
  return NextResponse.json({ success, message: success ? "Storyverse deleted" : "Failed" });
}
