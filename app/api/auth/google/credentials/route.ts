import { NextRequest, NextResponse } from 'next/server';
import { saveEnvVars } from '@/lib/coolify';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { clientId, clientSecret } = await request.json();

  if (!clientId?.trim() || !clientSecret?.trim()) {
    return NextResponse.json({ error: 'Both Client ID and Client Secret are required' }, { status: 400 });
  }

  // Apply in this process immediately so the OAuth redirect works without a restart
  process.env.GOOGLE_CLIENT_ID = clientId.trim();
  process.env.GOOGLE_CLIENT_SECRET = clientSecret.trim();

  // Persist to Coolify
  await saveEnvVars({
    GOOGLE_CLIENT_ID: clientId.trim(),
    GOOGLE_CLIENT_SECRET: clientSecret.trim(),
  });

  return NextResponse.json({ ok: true });
}
