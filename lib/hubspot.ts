const BASE = 'https://api.hubapi.com';

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export type Deal = {
  id: string;
  properties: {
    dealname: string;
    dealstage: string;
    amount: string | null;
    closedate: string | null;
    createdate: string;
    pipeline: string;
  };
};

export type Stage = {
  id: string;
  label: string;
  displayOrder: number;
  metadata: { isClosed: string; probability: string };
};

export type Pipeline = {
  id: string;
  label: string;
  stages: Stage[];
};

export async function fetchPipelines(): Promise<Pipeline[]> {
  const res = await fetch(`${BASE}/crm/v3/pipelines/deals`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HubSpot pipelines ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.results as Pipeline[];
}

export async function fetchDeals(): Promise<Deal[]> {
  const deals: Deal[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      properties: ['dealname', 'dealstage', 'amount', 'closedate', 'createdate', 'pipeline'],
      limit: 100,
    };
    if (after) body.after = after;

    const res = await fetch(`${BASE}/crm/v3/objects/deals/search`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HubSpot deals ${res.status}: ${await res.text()}`);
    const json = await res.json();
    deals.push(...(json.results as Deal[]));
    after = json.paging?.next?.after;
    if (after) await new Promise((r) => setTimeout(r, 300));
  } while (after && deals.length < 500);

  return deals;
}

export async function countNewContacts(since: Date): Promise<number> {
  const res = await fetch(`${BASE}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'createdate',
              operator: 'GTE',
              value: since.getTime().toString(),
            },
          ],
        },
      ],
      properties: ['createdate'],
      limit: 1,
    }),
  });
  if (!res.ok) throw new Error(`HubSpot contacts ${res.status}`);
  const json = await res.json();
  return json.total as number;
}
