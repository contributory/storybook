import type { Metadata } from "next";
import "./globals.css";
import { getSessionUser, getEffectiveLang } from "@/lib/auth";
import * as db from "@/lib/db";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import GlobalScripts from "@/components/GlobalScripts";

export const metadata: Metadata = {
  title: {
    default: "Storybook",
    template: "%s | Storybook",
  },
  description: "AI-supported collaborative storytelling platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const unreadNotifsCount = user ? await db.getUnreadNotificationsCount(user.username) : 0;
  const lang = await getEffectiveLang(user);

  return (
    <html lang={lang}>
      <body className="bg-gray-50 dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 min-h-screen flex flex-col selection:bg-yellow-500 selection:text-black">
        {/* Pre-paint theme bootstrap + global client helpers (theme, menus, auth modal, likes) */}
        <GlobalScripts lang={lang} />

        {/* Google Fonts & FontAwesome Icons (same assets as the previous layout) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

        {/* Tailwind CSS (CDN runtime with class-based dark mode, same as the previous layout) */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        serif: ['Lora', 'Merriweather', 'Georgia', 'serif'],
                        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                    }
                }
            }
        }`,
          }}
        />

        <Header user={user} unreadNotifsCount={unreadNotifsCount} lang={lang} />

        {/* Main Container */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

        <Footer />

        {/* Auth Modal */}
        <AuthModal lang={lang} />
      </body>
    </html>
  );
}
