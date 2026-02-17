# n8n-nodes-gus-ceidg

> **Polish version available:** [README.pl.md](./README.pl.md)

n8n community nodes for Polish business registries: **GUS BIR (REGON)** and **CEIDG**.

These nodes connect to the **Polish API Gateway** — a unified proxy for Polish government business APIs. The gateway handles authentication, caching, and rate limiting so the nodes themselves have zero external dependencies.

---

## Nodes

### GUS BIR (REGON)

Search the Polish REGON business register maintained by GUS (Statistics Poland).

**Operations:**

| Operation | Description |
|-----------|-------------|
| **Search** | Find a company by NIP, REGON, or KRS number |
| **Get Full Report** | Get a detailed report for a company by REGON (20+ report types) |
| **Get Summary Report** | Get a summary of recent changes in the REGON database |

**Available report types:**
- Natural Person — General Data, CEIDG Activity, Agricultural Activity, Other Activity
- Natural Person — PKD Codes, Local Units
- Legal Entity — General Data, PKD Codes, Local Units
- Civil Partnership Partners, Entity Type
- Public Reports (natural person, legal entity, CEIDG activity, entity type)

### CEIDG

Search the Polish CEIDG register (Central Registration and Information on Business) for sole proprietorships.

**Operations:**

| Operation | Description |
|-----------|-------------|
| **Search Businesses** | Search by NIP, REGON, or company name with optional filters |
| **Get Firma by ID** | Fetch full details of a single entry using its CEIDG UUID |
| **Get Changes** | Get a list of entries with recent changes |

**Search filters:** status, city, province, PKD activity code, pagination (limit/page).

---

## Credentials

Both nodes use the **Polish API Gateway** credential.

| Field | Required | Description |
|-------|----------|-------------|
| Gateway URL | Yes | Base URL of the gateway (default: `https://n8n-gw.svirus.ovh`) |
| API Key | No | Leave empty for free anonymous access |

### Getting started

1. **Anonymous (no setup)** — works without an API key. Limited to 100 requests/day, 10 req/min.
2. **Free account** — register at the gateway portal for 500 requests/month.
3. **Paid plans** — Starter (5,000 req/month) and Pro (50,000 req/month) for production workloads.

### Setting up credentials in n8n

1. Go to **Credentials** → **Add Credential** → search for **Polish API Gateway**.
2. Enter the Gateway URL (leave as default unless you self-host the gateway).
3. Optionally enter your API Key.
4. Save and use the credential in any GUS BIR or CEIDG node.

---

## Rate Limits

| Plan | Req/min | Monthly limit |
|------|---------|---------------|
| Anonymous | 10 | 100/day |
| Free | 30 | 500 |
| Starter | 60 | 5,000 |
| Pro | 120 | 50,000 |

When a limit is reached, the node displays a clear error message with instructions on how to upgrade or when the limit resets.

---

## Installation

### Via Community Nodes (recommended)

1. Go to **Settings → Community Nodes** in your n8n instance.
2. Click **Install**.
3. Enter `n8n-nodes-gus-ceidg`.
4. Accept the prompt and click **Install**.

### Manual (npm)

```bash
cd ~/.n8n
npm install n8n-nodes-gus-ceidg
```

Restart n8n after installation.

---

## Supported Operations & Permissions

- **GUS BIR** — Reads from the public GUS REGON database. No special API key required for basic search. Full reports require a GUS production key (obtained from GUS).
- **CEIDG** — Reads from the public CEIDG REST API. No special permissions required for public data.

All external API credentials are managed by the gateway — the n8n nodes only need the gateway URL and an optional gateway API key.

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `ANONYMOUS_DAILY_LIMIT` | 100 req/day limit reached | Register for a free API key |
| `MONTHLY_LIMIT_EXCEEDED` | Monthly plan limit reached | Upgrade plan or wait for reset |
| `RATE_LIMIT_EXCEEDED` | Too many requests per minute | Slow down or upgrade plan |
| `Gateway error: ...` | Gateway unreachable or internal error | Check gateway URL in credentials |
| No results found | Entity not in registry | Verify the NIP/REGON/KRS number |

---

## Development

```bash
git clone https://github.com/vrs-technology/n8n-nodes-gus-ceidg
cd n8n-nodes-gus-ceidg
npm install
npm run build
npm run lint
```

**Testing locally with n8n:**

```bash
npm link
cd ~/.n8n
npm link n8n-nodes-gus-ceidg
n8n start
```

> **Note:** The API Gateway must be running for the nodes to work. See [n8n-nodes-gateway](../n8n-nodes-gateway) for setup instructions.

---

## Compatibility

- **n8n** >= 1.0.0
- **Node.js** >= 18.0.0

---

## License

[MIT](LICENSE) — © 2026 Piotr Sikora
