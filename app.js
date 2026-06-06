require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { supabase } = require('./config/database');
const PROMPTS = require('./config/ai-prompts');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS per GitHub Pages
app.use(cors({
  origin: ['https://patriziopz.github.io', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BrevettIAmo Backend',
    version: '1.0.0',
    intelligenze: 19,
    timestamp: new Date().toISOString()
  });
});

// ========== LISTA 19 SERVIZI ==========
app.get('/api/services/list', (req, res) => {
  const services = [
    { id: 'priorArtBase', name: 'Ricerca Prior Art Base', prezzo: 11, credits: 1 },
    { id: 'priorArtAdvanced', name: 'Ricerca Prior Art Avanzata', prezzo: 23, credits: 2 },
    { id: 'brevettabilita', name: 'Analisi Brevettabilita', prezzo: 18, credits: 1 },
    { id: 'claimsBase', name: 'Redazione Claims Base', prezzo: 23, credits: 1 },
    { id: 'claimsPro', name: 'Redazione Claims Pro', prezzo: 47, credits: 2 },
    { id: 'traduzioneClaims', name: 'Traduzione Claims', prezzo: 14, credits: 1 },
    { id: 'monitoraggioConcorrenza', name: 'Monitoraggio Concorrenza', prezzo: 35, credits: 3 },
    { id: 'consulenza11', name: 'Consulenza 1:1', prezzo: 59, credits: 5 },
    { id: 'analisiTecnica', name: 'Analisi Tecnica', prezzo: 29, credits: 2 },
    { id: 'ricercaFigurativa', name: 'Ricerca Figurativa', prezzo: 23, credits: 2 },
    { id: 'nullita', name: 'Analisi Nullita', prezzo: 35, credits: 3 },
    { id: 'opposizione', name: 'Preparazione Opposizione', prezzo: 47, credits: 3 },
    { id: 'licensing', name: 'Strategia Licensing', prezzo: 59, credits: 4 },
    { id: 'valorizzazione', name: 'Valorizzazione Brevetto', prezzo: 99, credits: 5 },
    { id: 'dueDiligence', name: 'Due Diligence IP', prezzo: 149, credits: 6 },
    { id: 'freedomToOperate', name: 'Freedom to Operate', prezzo: 79, credits: 4 },
    { id: 'patentabilitySearch', name: 'Patentability Search', prezzo: 18, credits: 1 },
    { id: 'landscapeAnalysis', name: 'Landscape Analysis', prezzo: 59, credits: 3 },
    { id: 'cad', name: 'Disegno CAD Professionale', prezzo: 99, credits: 4 }
  ];
  
  res.json({ services, total: 19 });
});

// ========== ESEGUI SERVIZIO AI ==========
app.post('/api/services/execute', async (req, res) => {
  const { serviceId, input, language = 'it' } = req.body;

  if (!serviceId || !input) {
    return res.status(400).json({ error: 'serviceId e input richiesti' });
  }

  const systemPrompt = PROMPTS[serviceId];
  if (!systemPrompt) {
    return res.status(400).json({ error: 'Servizio non trovato tra le 19 intelligenze' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI non configurata',
      message: 'Aggiungi OPENROUTER_API_KEY su Render'
    });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
model: 'meta-llama/llama-3.1-8b-instruct',
        'X-Title': 'BrevettIAmo'
      },
      body: JSON.stringify({
       model: 'meta-llama/llama-3.1-8b-instruct', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Lingua: ${language}\n\n${input}` }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    // Salva su Supabase
    await supabase.from('service_usage').insert({
      service_id: serviceId,
      input: input.substring(0, 500),
      output: result.substring(0, 1000),
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      service: serviceId,
      result: result
    });

  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({
      error: 'Errore servizio AI',
      details: err.message
    });
  }
});

// ========== WEBHOOK LEMONSQUEEZY ==========
app.post('/api/webhook/lemonsqueezy', async (req, res) => {
  console.log('Webhook LemonSqueezy:', req.body.meta?.event_name);
  res.json({ received: true });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Errore interno server' });
});

app.listen(PORT, () => {
  console.log(`BrevettIAmo 19 Intelligenze - Porta ${PORT}`);
  console.log(`DB: ${process.env.SUPABASE_URL ? 'CONNESSO' : 'MANCANTE'}`);
  console.log(`AI: ${process.env.OPENROUTER_API_KEY ? 'CONNESSA' : 'MANCANTE'}`);
});
