// The root owner account defined by environment variables (protected from
// being edited/deleted). Kept in its own module so client components can use
// the flag without bundling the database client.
export const OWNER_USERNAME = (process.env.OWNER_USERNAME || "owner").toLowerCase();

export function isEnvOwnerUsername(username: string): boolean {
  return username.toLowerCase() === OWNER_USERNAME;
}
