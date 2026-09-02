import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  await ensureReady();
  const { id } = await params;
  const char = await db.getCharacterById(id);
  if (!char) return jsonError("Character not found", 404);
  const res = NextResponse.json({ success: true, character: char });
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
}

export async function PUT(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { id: charId } = await params;
  const character = await db.getCharacterById(charId);
  if (!character) return jsonError("Character not found", 404);

  const canEdit =
    character.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
  if (!canEdit) return jsonError("Forbidden", 403);

  try {
    const { name, description } = await req.json();
    const success = await db.updateCharacter(
      charId,
      name || character.name,
      description !== undefined ? description : character.description
    );
    return NextResponse.json({
      success,
      message: success ? "Character updated" : "Failed to update character",
    });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { id: charId } = await params;
  const character = await db.getCharacterById(charId);
  if (!character) return jsonError("Character not found", 404);

  const canDelete =
    character.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
  if (!canDelete) return jsonError("Forbidden", 403);

  const success = await db.deleteCharacter(charId);
  return NextResponse.json({ success, message: success ? "Character deleted" : "Failed" });
}
