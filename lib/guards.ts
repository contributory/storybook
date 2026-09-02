import * as db from "./db";

// Helper: check whether the user has enabled the "Nhà sáng tạo" (creator) permission.
// Admins and the owner always bypass this check.
export function hasCreatorAccess(user: db.User | null): boolean {
  return !!user && (user.is_creator || user.is_admin || user.is_owner);
}

// Gate helpers return the redirect target (or null when access is granted) so
// page components stay framework-agnostic and the rules remain unit-testable.

// Requires a logged-in user, otherwise redirect to home
export function loginGate(user: db.User | null): string | null {
  return user ? null : "/";
}

// Requires the "Nhà sáng tạo" permission (admins/owner bypass)
export function creatorGate(user: db.User | null): string | null {
  if (!user) return "/";
  if (!hasCreatorAccess(user)) return "/settings";
  return null;
}

// Requires admin or owner
export function adminGate(user: db.User | null): string | null {
  if (!user || (!user.is_admin && !user.is_owner)) return "/";
  return null;
}
