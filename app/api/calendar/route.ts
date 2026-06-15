import { NextResponse } from 'next/server';
import { fetchEvents } from '@/lib/google-calendar';
import { startOfWeek, addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json({ error: 'Google credentials not set in .env.local' }, { status: 503 });
  }

  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const twoWeeksOut = addDays(weekStart, 14);

    const events = await fetchEvents(weekStart, twoWeeksOut);

    const past = events.filter((e) => new Date(e.start) < now);
    const upcoming = events.filter((e) => new Date(e.start) >= now);

    return NextResponse.json({
      past,
      upcoming,
      totalThisWeek: past.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
