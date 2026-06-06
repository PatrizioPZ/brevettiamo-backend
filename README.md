# BrevettIAmo Backend

Backend Node.js per BrevettIAmo - Piattaforma AI per proprieta intellettuale con 19 servizi AI + CAD.

## Architettura

```
Frontend (GitHub Pages)
    |
    | JWT Token (Supabase Auth)
    v
Backend Node.js (Vercel/Railway/Render)
    |
    |---> Kimi API (Moonshot) - AI Engine
    |---> Supabase - Database
    |---> LemonSqueezy - Pagamenti
```

## Stack Tecnologico

| Componente | Tecnologia | Costo |
|-----------|-----------|-------|
| Runtime | Node.js 18+ | Gratis |
| Framework | Express.js | Gratis |
| AI Engine | Kimi API (Moonshot) | Gratis (1M token/mese) |
| Database | Supabase | Gratis (500MB) |
| Hosting | Vercel / Railway / Render | Gratis (hobby tier) |
| Pagamenti | LemonSqueezy | 5% + EUR 0.50/transazione |

## Prerequisiti

- Node.js 18+
- Account Supabase (gratis)
- Account Kimi API su [platform.moonshot.cn](https://platform.moonshot.cn) (gratis)
- Account LemonSqueezy (per pagamenti live)

## Installazione

### 1. Clona il repository

```bash
git clone https://github.com/patriziopz/brevettiamo-backend.git
cd brevettiamo-backend
```

### 2. Installa dipendenze

```bash
npm install
```

### 3. Configura variabili d'ambiente

```bash
cp .env.example .env
```

Modifica `.env` con le tue credenziali:

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase (dal tuo progetto Supabase)
SUPABASE_URL=https://tuo-progetto.supabase.co
SUPABASE_KEY=tua-chiave-anon
SUPABASE_SERVICE_KEY=tua-chiave-service-role

# Kimi API (da platform.moonshot.cn)
KIMI_API_KEY=sk-tua-chiave
KIMI_API_URL=https://api.moonshot.cn/v1/chat/completions
KIMI_MODEL=moonshot-v1-8k

# LemonSqueezy
LEMONSQUEEZY_API_KEY=your-api-key
LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret

# Security
JWT_SECRET=your-secret-key-min-32-characters

# Frontend
FRONTEND_URL=https://patriziopz.github.io
```

### 4. Crea tabelle su Supabase

1. Vai su [Supabase Dashboard](https://app.supabase.com)
2. Seleziona il tuo progetto
3. Vai su **SQL Editor** > **New query**
4. Copia e incolla il contenuto di `supabase-schema.sql`
5. Clicca **Run**

### 5. Avvia in locale

```bash
npm run dev
```

Server avviato su `http://localhost:3000`

## Deploy

### Deploy su Vercel (consigliato)

1. Pusha il codice su GitHub
2. Vai su [vercel.com](https://vercel.com)
3. Importa il repository
4. Aggiungi le variabili d'ambiente in Settings > Environment Variables
5. Deploy!

### Deploy su Railway

1. Vai su [railway.app](https://railway.app)
2. New Project > Deploy from GitHub repo
3. Aggiungi variabili d'ambiente
4. Deploy automatico

## API Endpoints

### Servizi AI

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/services/list` | Lista 19 servizi | No |
| GET | `/api/services/:id` | Dettaglio servizio | No |
| POST | `/api/services/execute` | Esegue servizio AI | JWT |
| GET | `/api/services/history` | Storico richieste | JWT |

### Esempio: eseguire servizio AI

```bash
curl -X POST https://tuo-backend.vercel.app/api/services/execute   -H "Content-Type: application/json"   -H "Authorization: Bearer <token-supabase>"   -d '{
    "serviceId": 1,
    "input": "Un dispositivo portatile per la purificazione dell aria che utilizza filtri a carboni attivi e UV-C...",
    "practiceId": "uuid-pratica-opzionale"
  }'
```

### Utente

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/profile` | Profilo + abbonamento | JWT |
| GET | `/api/user/usage` | Statistiche utilizzo | JWT |
| GET | `/api/user/payments` | Storico pagamenti | JWT |

### Webhook

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/webhook/lemonsqueezy` | Riceve eventi pagamento |

### Health Check

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/health` | Stato server |
| GET | `/` | Info API |

## I 19 Servizi AI

### Pacchetto Starter (EUR 29)

| # | Servizio | Descrizione |
|---|----------|-------------|
| 1 | Ricerca Prior Art Base | 5-10 brevetti simili, analisi rilevanza |
| 2 | Analisi Brevettabilita | Valutazione novita, attivita inventiva, punteggio 0-100 |
| 3 | Redazione Claims Base | Claims indipendenti + dipendenti |

### Pacchetto Pro (EUR 99) - include Starter + 7

| # | Servizio | Descrizione |
|---|----------|-------------|
| 4 | Ricerca Prior Art Avanzata | Multi-database, classificazione IPC/CPC, 15-20 risultati |
| 5 | Redazione Claims Pro | Multi-jurisdizione, fallback claims |
| 6 | Traduzione Claims | 6 lingue: EN, DE, FR, ES, CN, JP |
| 7 | Monitoraggio Concorrenza | Dashboard mensile competitor |
| 8 | Consulenza 1:1 AI | Risposte personalizzate su strategia brevettuale |
| 9 | Analisi Portfolio | Report C-level su portfolio esistente |
| 10 | Freedom to Operate | Analisi rischio violazione |

### Pacchetto Enterprise (EUR 299) - include tutti

| # | Servizio | Descrizione |
|---|----------|-------------|
| 11 | Descrizione Completa | Descrizione brevettuale pronta per deposito |
| 12 | Disegni Tecnici | Specifiche per disegnatore |
| 13 | Strategia Deposito | Roadmap PCT con budget |
| 14 | Valutazione Economica | DCF/costo/mercato |
| 15 | Due Diligence | M&A IP completa |
| 16 | Contratti Licenza | Template pronti all uso |
| 17 | Analisi Invalidita | Strategia opposizione |
| 18 | Gestione Scadenze | Calendario + alert |
| 19 | Disegno CAD Professionale | Istruzioni CAD con stima costi |

## Configurazione LemonSqueezy

### 1. Crea prodotti su LemonSqueezy

- Starter: EUR 29
- Pro: EUR 99 (segnala come POPOLARE)
- Enterprise: EUR 299

### 2. Configura webhook

1. Vai su LemonSqueezy > Settings > Webhooks
2. Aggiungi endpoint: `https://tuo-backend.vercel.app/api/webhook/lemonsqueezy`
3. Seleziona eventi: `order_created`, `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_payment_success`, `subscription_payment_failed`
4. Copia il **Webhook Secret** in `.env`

### 3. Aggiorna variant IDs

Nel file `src/routes/api/webhook.js`, aggiorna la mappa `planMap` con i tuoi variant ID reali da LemonSqueezy.

## Configurazione Frontend

Aggiorna il frontend per chiamare il backend:

```javascript
// Esempio chiamata API dal frontend
async function executeService(serviceId, input) {
  const token = await supabase.auth.getSession();

  const response = await fetch('https://tuo-backend.vercel.app/api/services/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.data.session.access_token}`
    },
    body: JSON.stringify({
      serviceId: serviceId,
      input: input,
      practiceId: currentPracticeId
    })
  });

  return await response.json();
}
```

## Sicurezza

- **Helmet**: header HTTP sicuri
- **CORS**: solo domini autorizzati
- **Rate Limiting**: 100 req/15min generale, 30 req/1h per AI
- **JWT**: autenticazione via Supabase Auth
- **RLS**: Row Level Security su Supabase
- **Webhook Signature**: verifica firma LemonSqueezy

## Costi Stimati

| Periodo | Costo | Note |
|---------|-------|------|
| Mese 1-6 | EUR 0 | Tutto gratis (Kimi 1M token, Supabase 500MB, Vercel hobby) |
| Mese 7-12 | EUR 0-70 | Dipende da utenti attivi |
| Oltre | EUR 70-150 | Se superi limiti gratis |

## Troubleshooting

### Errore "KIMI_API_KEY non configurata"
Ottieni API key su [platform.moonshot.cn](https://platform.moonshot.cn)

### Errore "Token non valido"
L'utente deve essere loggato su Supabase Auth

### Webhook non ricevuti
Verifica che l'URL del webhook sia pubblico (non localhost)

### Limite rate API
Kimi API: 1M token/mese gratis. Se superi, passa a piano a pagamento.

## Licenza

Proprieta intellettuale di BrevettIAmo. Tutti i diritti riservati.

## Supporto

Per assistenza: support@brevettiamo.com

---

**BrevettIAmo** - Democratizzare la proprieta intellettuale con AI
