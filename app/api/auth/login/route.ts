import { NextResponse } from 'next/server';
import { AUTH_COOKIE, getExpectedToken } from '@/lib/auth';

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function POST(req: Request) {
  const { password } = await req.json();

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = await getExpectedToken();
  const res = NextResponse.json({ ok: true });

  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: THIRTY_DAYS,
    path: '/',
  });

  return res;
}
