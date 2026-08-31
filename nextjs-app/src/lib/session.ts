import { cookies } from 'next/headers';
import * as db from './db';
import { sha256 } from './auth';

const APP_SECRET = process.env.APP_SECRET || "nextjs-storybook-secret-key-123456";

async function generateSessionHash(username: string, passwordHash: string): Promise<string> {
  return await sha256(`${username}:${passwordHash}:${APP_SECRET}`);
}

export async function getSession() {
  const cookieStore = await cookies();
  const username = cookieStore.get('user_username')?.value;
  const sessionHash = cookieStore.get('user_session')?.value;

  if (!username || !sessionHash) {
    return null;
  }

  const user = await db.getUserByUsername(username);
  if (!user) {
    return null;
  }

  const expectedHash = await generateSessionHash(user.username, user.password_hash);
  if (sessionHash !== expectedHash) {
    return null;
  }

  return user;
}

export async function setAuthCookies(username: string, passwordHash: string) {
  const cookieStore = await cookies();
  const sessionHash = await generateSessionHash(username, passwordHash);
  const maxAge = 60 * 60 * 24 * 365; // 365 days

  cookieStore.set('user_username', username, {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  cookieStore.set('user_session', sessionHash, {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('user_username');
  cookieStore.delete('user_session');
}
