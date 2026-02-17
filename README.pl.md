# n8n-nodes-gus-ceidg (dokumentacja po polsku)

> **English version (required by n8n):** [README.md](./README.md)

Węzły n8n do polskich rejestrów gospodarczych: **GUS BIR (REGON)** i **CEIDG**.

Węzły łączą się przez **Polish API Gateway** — ujednolicony proxy do polskich rządowych API biznesowych. Gateway obsługuje uwierzytelnianie, cache i rate limiting — same węzły nie mają żadnych zewnętrznych zależności.

---

## Węzły

### GUS BIR (REGON)

Wyszukiwanie w bazie REGON prowadzonej przez GUS (Główny Urząd Statystyczny).

**Operacje:**

| Operacja | Opis |
|----------|------|
| **Search** | Wyszukiwanie firmy po NIP, REGON lub KRS |
| **Get Full Report** | Pobranie szczegółowego raportu po REGON (20+ typów raportów) |
| **Get Summary Report** | Raport zbiorczy zmian w bazie REGON |

### CEIDG

Wyszukiwanie w rejestrze CEIDG (Centralna Ewidencja i Informacja o Działalności Gospodarczej).

**Operacje:**

| Operacja | Opis |
|----------|------|
| **Search Businesses** | Wyszukiwanie po NIP, REGON lub nazwie firmy z filtrami |
| **Get Firma by ID** | Pobranie pełnych danych wpisu po UUID CEIDG |
| **Get Changes** | Lista wpisów z ostatnimi zmianami |

---

## Poświadczenia (Credentials)

Oba węzły korzystają z credential **Polish API Gateway**.

| Pole | Wymagane | Opis |
|------|----------|------|
| Gateway URL | Tak | Adres URL gateway (domyślnie: `https://n8n-gw.svirus.ovh`) |
| API Key | Nie | Pozostaw puste dla anonimowego dostępu |

### Jak zacząć

1. **Dostęp anonimowy** — działa bez klucza API. Limit: 100 zapytań/dzień, 10/min.
2. **Darmowe konto** — rejestracja w portalu gateway daje 500 zapytań/miesiąc.
3. **Plany płatne** — Starter (5 000/msc) i Pro (50 000/msc) do użytku produkcyjnego.

---

## Limity

| Plan | Zapytań/min | Limit miesięczny |
|------|-------------|------------------|
| Anonimowy | 10 | 100/dzień |
| Free | 30 | 500 |
| Starter | 60 | 5 000 |
| Pro | 120 | 50 000 |

---

## Instalacja

### Przez Community Nodes (zalecane)

1. Przejdź do **Settings → Community Nodes** w swojej instancji n8n.
2. Kliknij **Install**.
3. Wpisz `n8n-nodes-gus-ceidg`.
4. Zaakceptuj i kliknij **Install**.

### Ręcznie (npm)

```bash
cd ~/.n8n
npm install n8n-nodes-gus-ceidg
```

Po instalacji zrestartuj n8n.

---

## Rozwiązywanie problemów

| Błąd | Przyczyna | Rozwiązanie |
|------|-----------|-------------|
| `ANONYMOUS_DAILY_LIMIT` | Osiągnięto limit 100 zapytań/dzień | Zarejestruj darmowy klucz API |
| `MONTHLY_LIMIT_EXCEEDED` | Osiągnięto miesięczny limit planu | Zmień plan lub poczekaj na reset |
| `RATE_LIMIT_EXCEEDED` | Za dużo zapytań na minutę | Zwolnij lub zmień plan |
| `Gateway error: ...` | Gateway niedostępny | Sprawdź Gateway URL w credentials |
| No results found | Podmiot nie istnieje w rejestrze | Sprawdź numer NIP/REGON/KRS |

---

## Licencja

[MIT](LICENSE) — © 2026 Piotr Sikora
