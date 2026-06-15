export const AUTH_COOKIE = 'sales-auth';

async function sha256(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getExpectedToken(): Promise<string> {
  const password = process.env.DASHBOARD_PASSWORD ?? '';
  const secret = process.env.SESSION_SECRET ?? 'dashboard-default-secret';
  return sha256(`${password}:${secret}`);
}
