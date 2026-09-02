import * as db from "./db";
import { sha256 } from "./session";

// Initialize Owner account (previously in the Hono middleware)
export async function ensureOwnerAccount() {
  const ownerUsername = process.env.OWNER_USERNAME || "owner";
  const ownerPassword = process.env.OWNER_PASSWORD || "owner123";

  const existingOwner = await db.getUserByUsername(ownerUsername);
  const passwordHash = await sha256(ownerPassword);

  if (!existingOwner) {
    console.log(`Creating owner account with username: '${ownerUsername}'`);
    await db.createUser(ownerUsername, "System Owner", passwordHash, true, true);
  } else {
    // Keep password updated with env variables
    await db.executeQuery(
      `UPDATE users SET password_hash = ?, is_admin = 1, is_owner = 1 WHERE username = ?`,
      [passwordHash, ownerUsername.toLowerCase()]
    );
  }
}

// One-time per-process bootstrap: schema init + owner account provisioning.
let readyPromise: Promise<void> | null = null;

export function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      await db.initDb();
      await ensureOwnerAccount();
    })().catch((err) => {
      readyPromise = null; // allow retry on next request
      throw err;
    });
  }
  return readyPromise;
}
