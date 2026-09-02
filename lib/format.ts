// Locale helpers shared by server & client rendering.
// Date rendering goes through these helpers so SSR and client output match
// (they are rendered inside `suppressHydrationWarning` elements).

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
