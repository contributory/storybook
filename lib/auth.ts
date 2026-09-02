import { cookies } from "next/headers";
import { cache } from "react";
import * as db from "./db";
import { authenticate, AUTH_COOKIE, SESSION_COOKIE } from "./session";
import { ensureReady } from "./bootstrap";
import { normalizeLanguage, type Language } from "./i18n";

// Resolve the authenticated user for React Server Components. Memoized per
// request with React `cache()` so the layout and the page share one lookup.
export const getSessionUser = cache(async (): Promise<db.User | null> => {
  await ensureReady();
  const store = await cookies();
  return authenticate(store.get(AUTH_COOKIE)?.value, store.get(SESSION_COOKIE)?.value);
});

// Effective language = user preference, else `lang` cookie, else Vietnamese
export async function getEffectiveLang(user: db.User | null): Promise<Language> {
  const store = await cookies();
  return normalizeLanguage(user?.language || store.get("lang")?.value || "vi");
}
