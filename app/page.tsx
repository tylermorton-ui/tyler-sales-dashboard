'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import MetricCard from '@/components/MetricCard';
import PipelineChart from '@/components/PipelineChart';
import CalendarFeed from '@/components/CalendarFeed';

type HubSpotData = {
  revenue: { closedWonWeek: number; closedWonMonth: number };
  pipeline: {
    stages: Array<{ label: string; count: number; value: number }>;
    totalValue: number;
    totalDeals: number;
  };
  leads: { newThisWeek: number };
  error?: string;
};

type CalendarData = {
  past: Array<{ id: string; summary: string; start: string; end: string; attendees: number }>;
  upcoming: Array<{ id: string; summary: string; start: string; end: string; attendees: number }>;
  totalThisWeek: number;
  error?: string;
};

function fmt(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v.toFixed(0)}`;
}

export default function Page() {
  const [hs, setHs] = useState<HubSpotData | null>(null);
  const [cal, setCal] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hsRes, calRes] = await Promise.all([
        fetch('/api/hubspot').then((r) => r.json()),
        fetch('/api/calendar').then((r) => r.json()),
      ]);
      setHs(hsRes);
      setCal(calRes);
    } finally {
      setLastRefreshed(new Date());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">Week of {weekLabel}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              Updated {format(lastRefreshed, 'h:mm a')}
            </span>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {/* Error banners */}
        {hs?.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <strong>HubSpot:</strong> {hs.error}
          </div>
        )}
        {cal?.error && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Google Calendar:</strong> {cal.error}
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Closed This Week"
            value={loading || !hs ? '—' : fmt(hs.revenue?.closedWonWeek ?? 0)}
            sub={hs ? `${fmt(hs.revenue?.closedWonMonth ?? 0)} MTD` : undefined}
            accent="green"
          />
          <MetricCard
            label="Active Pipeline"
            value={loading || !hs ? '—' : fmt(hs.pipeline?.totalValue ?? 0)}
            sub={hs ? `${hs.pipeline?.totalDeals ?? 0} open deals` : undefined}
            accent="blue"
          />
          <MetricCard
            label="New Leads"
            value={loading || !hs ? '—' : String(hs.leads?.newThisWeek ?? 0)}
            sub="contacts this week"
            accent="purple"
          />
          <MetricCard
            label="Meetings This Week"
            value={loading || !cal ? '—' : String(cal.totalThisWeek ?? 0)}
            sub={cal ? `${cal.upcoming?.length ?? 0} upcoming` : undefined}
            accent="amber"
          />
        </div>

        {/* Pipeline + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Pipeline by Stage</h2>
            {loading ? (
              <div className="h-52 flex items-center justify-center text-gray-300 text-sm animate-pulse">
                Loading…
              </div>
            ) : (
              <PipelineChart stages={hs?.pipeline?.stages ?? []} />
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Calendar</h2>
            {loading ? (
              <div className="h-52 flex items-center justify-center text-gray-300 text-sm animate-pulse">
                Loading…
              </div>
            ) : (
              <CalendarFeed past={cal?.past ?? []} upcoming={cal?.upcoming ?? []} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
