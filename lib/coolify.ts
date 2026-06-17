const BASE = process.env.COOLIFY_BASE_URL ?? 'https://coolify.designli.io';
const TOKEN = process.env.COOLIFY_API_TOKEN ?? '';
const UUID = process.env.COOLIFY_APP_UUID ?? '';

async function req(path: string, options: RequestInit = {}) {
  return fetch(`${BASE}/api/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function saveEnvVars(vars: Record<string, string>): Promise<void> {
  if (!TOKEN || !UUID) return;
  const data = Object.entries(vars).map(([key, value]) => ({
    key,
    value,
    is_multiline: false,
    is_shown_once: false,
  }));
  await req(`/applications/${UUID}/envs/bulk`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}
