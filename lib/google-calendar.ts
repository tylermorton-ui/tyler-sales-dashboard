import { google } from 'googleapis';

function getAuth() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

export type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees: number;
};

export async function fetchEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
  const calendar = google.calendar({ version: 'v3', auth: getAuth() });

  const res = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 200,
  });

  return (res.data.items ?? [])
    .filter((e) => e.status !== 'cancelled')
    .map((e) => ({
      id: e.id ?? '',
      summary: e.summary ?? '(No title)',
      start: e.start?.dateTime ?? e.start?.date ?? '',
      end: e.end?.dateTime ?? e.end?.date ?? '',
      attendees: (e.attendees ?? []).filter((a) => a.responseStatus !== 'declined').length,
    }));
}
