import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { saveEnvVars } from '@/lib/coolify';

export const dynamic = 'force-dynamic';

function getOrigin(request: Request): string {
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const oauthError = searchParams.get('error');
  const origin = getOrigin(request);

  if (oauthError || !code) {
    const url = new URL('/setup', origin);
    url.searchParams.set('error', 'oauth-cancelled');
    return NextResponse.redirect(url.toString());
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const url = new URL('/setup', origin);
    url.searchParams.set('error', 'missing-credentials');
    return NextResponse.redirect(url.toString());
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      const url = new URL('/setup', origin);
      url.searchParams.set('error', 'no-refresh-token');
      return NextResponse.redirect(url.toString());
    }

    // Apply immediately so calendar works in this process without a restart
    process.env.GOOGLE_REFRESH_TOKEN = refreshToken;

    // Persist to Coolify so it survives future deploys
    await saveEnvVars({ GOOGLE_REFRESH_TOKEN: refreshToken });

    return NextResponse.redirect(`${origin}/?calendar=connected`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const url = new URL('/setup', origin);
    url.searchParams.set('error', msg);
    return NextResponse.redirect(url.toString());
  }
}
