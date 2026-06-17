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

async function searchDeals(filters: unknown[], properties = DEAL_PROPS): Promise<Deal[]> {
  const deals: Deal[] = [];
  let after: string | undefined;
  do {
    const body: Record<string, unknown> = { filterGroups: [{ filters }], properties, limit: 100 };
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

const DEAL_PROPS = ['dealname', 'dealstage', 'amount', 'closedate', 'createdate', 'pipeline'];

export async function fetchOpenDeals(): Promise<Deal[]> {
  return searchDeals([{ propertyName: 'hs_is_closed', operator: 'EQ', value: 'false' }]);
}

export async function fetchClosedWonDeals(since: Date): Promise<Deal[]> {
  return searchDeals([
    { propertyName: 'dealstage', operator: 'EQ', value: 'closedwon' },
    { propertyName: 'closedate', operator: 'GTE', value: since.getTime().toString() },
  ]);
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
