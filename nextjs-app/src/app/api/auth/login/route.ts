import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { verifyPassword, ensureOwnerAccount } from '@/lib/auth';
import { setAuthCookies } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Ensure owner account exists
    await ensureOwnerAccount();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Tên đăng nhập và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Set session cookies
    await setAuthCookies(user.username, user.password_hash);

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        display_name: user.display_name,
        is_creator: user.is_creator,
        is_admin: user.is_admin,
        is_owner: user.is_owner,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng nhập' },
      { status: 500 }
    );
  }
}
