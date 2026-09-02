import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/api";

export async function POST() {
  const res = NextResponse.json({ success: true });
  return clearAuthCookies(res);
}
