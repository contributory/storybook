import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { hashPassword, ensureOwnerAccount } from '@/lib/auth';
import { setAuthCookies } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Ensure owner account exists
    await ensureOwnerAccount();

    const { username, password, displayName } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'Tên đăng nhập phải từ 3-20 ký tự' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã tồn tại' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    await db.createUser(
      username,
      displayName || username,
      passwordHash,
      false,
      false
    );

    // Get the created user
    const user = await db.getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'Không thể tạo tài khoản' },
        { status: 500 }
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
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng ký' },
      { status: 500 }
    );
  }
}
