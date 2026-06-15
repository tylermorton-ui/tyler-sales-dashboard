// One-time script to get a Google OAuth2 refresh token.
// Run: GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/google-auth.js
// Then paste the printed GOOGLE_REFRESH_TOKEN into .env.local.

const { google } = require('googleapis');
const http = require('http');
const { exec } = require('child_process');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 3005;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    '\n❌  Set credentials before running:\n\n' +
    '  export GOOGLE_CLIENT_ID=your_client_id\n' +
    '  export GOOGLE_CLIENT_SECRET=your_client_secret\n\n' +
    'Get them from: console.cloud.google.com\n' +
    '  → APIs & Services → Credentials → Create OAuth 2.0 Client ID\n' +
    '  → Type: Web application\n' +
    '  → Authorized redirect URI: http://localhost:3005/oauth2callback\n',
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/calendar.readonly'],
});

console.log('\n🔑  Opening Google authorization in your browser…\n');
exec(`open "${authUrl}"`);

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/oauth2callback')) {
    res.end('Not found');
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400);
    res.end('Missing authorization code');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2 style="font-family:sans-serif;padding:2rem">✅ Authorized! You can close this tab.</h2>');

    console.log('\n✅  Success! Add this to your .env.local:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    console.log('Then restart npm run dev.\n');
  } catch (err) {
    res.writeHead(500);
    res.end('Token exchange failed — check the console.');
    console.error('Error:', err.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`Waiting for OAuth callback on port ${PORT}…\n`);
});
