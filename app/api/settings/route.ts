import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

export async function POST(req: Request) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const { display_name, is_creator, ai_author_name, des, avatar, language } = await req.json();
    if (!display_name) {
      return jsonError("Display name is required", 400);
    }

    // Validate language if provided
    let validatedLanguage = undefined;
    if (language && (SUPPORTED_LANGUAGES as string[]).includes(language)) {
      validatedLanguage = language;
    }

    const success = await db.updateUserSettings(
      user.username,
      display_name.trim(),
      !!is_creator,
      (ai_author_name || "").trim(),
      (des || "").trim(),
      (avatar || "").trim(),
      validatedLanguage
    );

    return NextResponse.json({ success });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
