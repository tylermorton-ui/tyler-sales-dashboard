'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Status = {
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  connected: boolean;
};

export default function SetupPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const uri = `${window.location.origin}/api/auth/google/callback`;
    setRedirectUri(uri);

    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'no-refresh-token') {
      setError('No refresh token received. Make sure you selected "Allow" on the Google consent screen and try again.');
    } else if (err === 'oauth-cancelled') {
      setError('Authorization was cancelled. Please try again.');
    } else if (err === 'missing-credentials') {
      setError('Google credentials are not set. Please complete step 2 first.');
    } else if (err) {
      setError(err);
    }

    fetchStatus();
  }, []);

  async function fetchStatus() {
    const res = await fetch('/api/auth/google/status');
    const data = await res.json();
    setStatus(data);
  }

  async function saveCredentials() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save credentials');
        return;
      }
      setSaved(true);
      setClientId('');
      setClientSecret('');
      await fetchStatus();
    } finally {
      setSaving(false);
    }
  }

  function copyRedirectUri() {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const credentialsReady = status?.hasClientId && status?.hasClientSecret;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Google Calendar Setup</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Connect your calendar to see events on the dashboard
            </p>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
            ← Dashboard
          </Link>
        </div>

        {status?.connected && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm font-semibold text-green-800">Google Calendar is connected</p>
            <p className="text-xs text-green-600 mt-1">
              Calendar events are showing on your dashboard.
            </p>
            <Link
              href="/"
              className="mt-3 inline-block text-sm font-medium text-green-700 hover:text-green-800 underline"
            >
              Go to dashboard →
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start gap-4">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
              1
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900">Create Google OAuth credentials</h2>
              <ol className="text-sm text-gray-600 mt-2 space-y-1.5 list-decimal list-inside">
                <li>
                  Open{' '}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    console.cloud.google.com
                  </a>{' '}
                  — create or select a project
                </li>
                <li>
                  Search for <strong>Google Calendar API</strong> and enable it
                </li>
                <li>
                  Go to <strong>APIs &amp; Services → Credentials</strong>
                </li>
                <li>
                  Click <strong>Create Credentials → OAuth 2.0 Client ID</strong>
                </li>
                <li>
                  Set type to <strong>Web application</strong>
                </li>
                <li>
                  Under <strong>Authorized redirect URIs</strong>, add this URL exactly:
                </li>
              </ol>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 min-w-0 bg-gray-100 text-gray-800 text-xs font-mono px-3 py-2 rounded-lg break-all">
                  {redirectUri || 'Loading…'}
                </code>
                <button
                  onClick={copyRedirectUri}
                  className="flex-shrink-0 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors cursor-pointer font-medium"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start gap-4">
            <span
              className={`flex-shrink-0 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5 ${
                credentialsReady ? 'bg-green-500' : 'bg-blue-600'
              }`}
            >
              {credentialsReady ? '✓' : '2'}
            </span>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Enter your credentials</h2>
              {credentialsReady && !saved ? (
                <p className="text-sm text-green-600 mt-1">Credentials are already saved.</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mt-1">
                    Paste the Client ID and Client Secret from Google Cloud Console.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="123456789-abc.apps.googleusercontent.com"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Client Secret
                      </label>
                      <input
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="GOCSPX-…"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {saved && (
                      <p className="text-sm text-green-600 font-medium">Credentials saved!</p>
                    )}
                    <button
                      onClick={saveCredentials}
                      disabled={saving || !clientId.trim() || !clientSecret.trim()}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {saving ? 'Saving…' : 'Save Credentials'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <span
              className={`flex-shrink-0 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5 ${
                status?.connected ? 'bg-green-500' : 'bg-blue-600'
              }`}
            >
              {status?.connected ? '✓' : '3'}
            </span>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Authorize Google Calendar</h2>
              <p className="text-sm text-gray-500 mt-1">
                Click the button below to authorize read-only access to your calendar.
              </p>
              {status?.connected ? (
                <p className="text-sm text-green-600 mt-3 font-medium">Connected!</p>
              ) : (
                <>
                  <a
                    href={credentialsReady ? '/api/auth/google' : undefined}
                    onClick={(e) => !credentialsReady && e.preventDefault()}
                    className={`mt-4 inline-block px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      credentialsReady
                        ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Connect Google Calendar →
                  </a>
                  {!credentialsReady && (
                    <p className="text-xs text-gray-400 mt-2">Complete step 2 first</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
