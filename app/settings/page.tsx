import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { normalizeLanguage, t } from "@/lib/i18n";
import SettingsPageView from "@/components/views/SettingsPageView";

export async function generateMetadata() {
  const store = await cookies();
  const lang = normalizeLanguage(store.get("lang")?.value || "vi");
  return { title: t("settings.title", lang) };
}

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  // Get language from user preference or cookie (default to 'vi')
  const store = await cookies();
  const lang = normalizeLanguage(user.language || store.get("lang")?.value || "vi");

  return <SettingsPageView user={user} currentLang={lang} />;
}
