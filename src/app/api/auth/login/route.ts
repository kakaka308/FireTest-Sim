import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    const result = await login(username, password);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 401 });
    }

    return NextResponse.json({
      userid: result.userid,
      username: result.username,
      usertype: result.usertype,
    });
  } catch (error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
