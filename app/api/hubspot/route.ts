import { NextResponse } from 'next/server';
import { fetchPipelines, fetchOpenDeals, fetchClosedWonDeals, countNewContacts } from '@/lib/hubspot';
import { startOfWeek, endOfWeek, startOfMonth, isWithinInterval } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'HUBSPOT_ACCESS_TOKEN not set in .env.local' }, { status: 503 });
  }

  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const [pipelines, openDeals, closedWonDeals, newLeads] = await Promise.all([
      fetchPipelines(),
      fetchOpenDeals(),
      fetchClosedWonDeals(monthStart),
      countNewContacts(weekStart),
    ]);

    const stageLabels: Record<string, string> = {};
    const closedWonIds = new Set<string>();
    const closedLostIds = new Set<string>();

    for (const pl of pipelines) {
      for (const s of pl.stages) {
        stageLabels[s.id] = s.label;
        if (s.metadata?.isClosed === 'true') {
          if (parseFloat(s.metadata.probability) >= 1) closedWonIds.add(s.id);
          else closedLostIds.add(s.id);
        }
      }
    }

    const primaryPipeline = pipelines[0];
    const stageOrder: Record<string, number> = {};
    if (primaryPipeline) {
      primaryPipeline.stages.forEach((s, i) => {
        stageOrder[s.id] = i;
      });
    }

    // Tally closed-won revenue from the targeted query
    let closedWonWeek = 0;
    let closedWonMonth = 0;
    for (const deal of closedWonDeals) {
      const value = parseFloat(deal.properties.amount ?? '0') || 0;
      const cd = deal.properties.closedate ? new Date(deal.properties.closedate) : null;
      if (cd && isWithinInterval(cd, { start: weekStart, end: weekEnd })) closedWonWeek += value;
      if (cd && isWithinInterval(cd, { start: monthStart, end: now })) closedWonMonth += value;
    }

    // Build pipeline from open deals only
    const stageMap: Record<string, { label: string; count: number; value: number; order: number }> = {};
    for (const deal of openDeals) {
      const { dealstage, amount } = deal.properties;
      if (closedLostIds.has(dealstage)) continue;
      if (!stageMap[dealstage]) {
        stageMap[dealstage] = {
          label: stageLabels[dealstage] ?? dealstage,
          count: 0,
          value: 0,
          order: stageOrder[dealstage] ?? 99,
        };
      }
      stageMap[dealstage].count += 1;
      stageMap[dealstage].value += parseFloat(amount ?? '0') || 0;
    }

    const pipeline = Object.values(stageMap).sort((a, b) => a.order - b.order);

    return NextResponse.json({
      revenue: { closedWonWeek, closedWonMonth },
      pipeline: {
        stages: pipeline,
        totalValue: pipeline.reduce((s, st) => s + st.value, 0),
        totalDeals: pipeline.reduce((s, st) => s + st.count, 0),
      },
      leads: { newThisWeek: newLeads },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
