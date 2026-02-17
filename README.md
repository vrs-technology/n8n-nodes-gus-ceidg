# n8n-nodes-gus-ceidg

n8n community nodes for Polish business registries: **GUS BIR (REGON)** and **CEIDG**.

Węzły n8n do polskich rejestrów gospodarczych: **GUS BIR (REGON)** i **CEIDG**.

---

## Nodes

### GUS BIR (REGON)

Search the Polish REGON business register maintained by GUS (Główny Urząd Statystyczny / Statistics Poland).

Wyszukiwanie w bazie REGON prowadzonej przez GUS.

**Operations / Operacje:**

| Operation | Description | Opis |
|-----------|-------------|------|
| **Search** | Find a company by NIP, REGON, or KRS | Wyszukiwanie firmy po NIP, REGON lub KRS |
| **Get Full Report** | Get detailed report for a company by REGON (20+ report types) | Pobranie szczegółowego raportu po REGON (20+ typów raportów) |
| **Get Summary Report** | Get summary of recent database changes | Pobranie raportu zbiorczego zmian w bazie |

**Report types include / Dostępne typy raportów:**
- Natural person general data / Osoba fizyczna - dane ogólne
- Legal entity / Osoba prawna
- CEIDG activity / Działalność CEIDG
- PKD codes / Kody PKD
- Local units / Jednostki lokalne
- Civil partnership partners / Wspólnicy spółki cywilnej
- and more / i inne

### CEIDG

Search the Polish CEIDG register (Centralna Ewidencja i Informacja o Działalności Gospodarczej) for sole proprietorships.

Wyszukiwanie w rejestrze CEIDG (Centralna Ewidencja i Informacja o Działalności Gospodarczej).

**Operations / Operacje:**

| Operation | Description | Opis |
|-----------|-------------|------|
| **Search Businesses** | Search by NIP, REGON, KRS, or company name with filters | Wyszukiwanie po NIP, REGON, KRS lub nazwie z filtrami |
| **Get Changes** | Monitor recent changes in the register | Monitorowanie zmian w rejestrze |

**Search filters / Filtry wyszukiwania:**
- Status: active, suspended, removed / aktywny, zawieszony, wykreślony
- City, province / Miasto, województwo
- PKD code / Kod PKD
- Pagination / Paginacja

---

## Credentials / Poświadczenia

### Polish API Gateway

Both nodes connect through the **Polish API Gateway** — a unified access point for Polish government and business APIs.

Oba węzły łączą się przez **Polish API Gateway** — ujednolicony punkt dostępu do polskich API rządowych i biznesowych.

| Field | Description | Opis |
|-------|-------------|------|
| Gateway URL | URL of the API Gateway | Adres URL bramy API |
| API Key | Optional API key for higher limits | Opcjonalny klucz API dla wyższych limitów |

**How to get started / Jak zacząć:**

1. **Free access** — works without an API key. Limited to 100 requests/day, 10 req/min.
2. **Register** — create a free account at the gateway portal for 500 requests/month.
3. **Paid plans** — Starter (5,000 req/month) and Pro (50,000 req/month) for production use.

**Darmowy dostęp** — działa bez klucza API. Limit: 100 zapytań/dzień, 10/min.
**Rejestracja** — darmowe konto w portalu daje 500 zapytań/miesiąc.
**Plany płatne** — Starter (5 000/msc) i Pro (50 000/msc) do użytku produkcyjnego.

---

## Rate Limits / Limity

| Plan | Requests/min | Monthly Limit | Zapytań/min | Limit miesięczny |
|------|-------------|---------------|-------------|------------------|
| Anonymous | 10 | 100/day | 10 | 100/dzień |
| Free | 30 | 500 | 30 | 500 |
| Starter | 60 | 5,000 | 60 | 5 000 |
| Pro | 120 | 50,000 | 120 | 50 000 |

When a limit is reached, the node will display a clear error message with instructions to upgrade or wait.

Po przekroczeniu limitu węzeł wyświetli komunikat z instrukcją — jak uzyskać wyższy limit lub poczekać na reset.

---

## Installation / Instalacja

### Community Nodes (recommended)

1. Go to **Settings > Community Nodes** in your n8n instance.
2. Select **Install**.
3. Enter `n8n-nodes-gus-ceidg`.
4. Agree to the risks and click **Install**.

### Manual

```bash
cd ~/.n8n
npm install n8n-nodes-gus-ceidg
```

Restart n8n after installation. / Po instalacji zrestartuj n8n.

---

## Development / Rozwój

```bash
git clone <repo-url>
cd n8n-nodes-gus-ceidg
npm install
npm run build
```

To test locally with n8n: / Testowanie lokalne z n8n:

```bash
npm link
cd ~/.n8n
npm link n8n-nodes-gus-ceidg
n8n start
```

**Note:** The API Gateway must be running for the nodes to work. See `n8n-nodes-gateway` for setup instructions.

**Uwaga:** Do działania węzłów wymagany jest uruchomiony API Gateway. Instrukcja uruchomienia w `n8n-nodes-gateway`.

---

## Compatibility / Kompatybilność

- n8n >= 1.0.0
- Node.js >= 22.0.0

## License / Licencja

[MIT](LICENSE)
