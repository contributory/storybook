import bcrypt from 'bcryptjs';
import * as db from './db';

// App Secret for Cookie signing
const APP_SECRET = process.env.APP_SECRET || "nextjs-storybook-secret-key-123456";

// SHA-256 Hash Helper (using Web Crypto API)
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Session Signature Helper
async function generateSessionHash(username: string, passwordHash: string): Promise<string> {
  return await sha256(`${username}:${passwordHash}:${APP_SECRET}`);
}

// Initialize Owner account
export async function ensureOwnerAccount() {
  const ownerUsername = process.env.OWNER_USERNAME || "owner";
  const ownerPassword = process.env.OWNER_PASSWORD || "owner123";

  const existingOwner = await db.getUserByUsername(ownerUsername);
  const passwordHash = await sha256(ownerPassword);

  if (!existingOwner) {
    console.log(`Creating owner account with username: '${ownerUsername}'`);
    await db.createUser(ownerUsername, "System Owner", passwordHash, true, true);
  } else {
    // Update password if changed in env
    if (existingOwner.password_hash !== passwordHash) {
      await db.updateUserProfile(ownerUsername, { 
        password_hash: passwordHash,
        is_admin: true,
        is_owner: true 
      });
    }
  }
}

// Helper: check whether the user has creator permission
export function hasCreatorAccess(user: db.User | null): boolean {
  return !!user && (user.is_creator || user.is_admin || user.is_owner);
}

// Password hashing using bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
