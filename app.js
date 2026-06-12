require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { supabase } = require('./config/database');
const PROMPTS = require('./config/ai-prompts');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(cors({
  origin: ['https://patriziopz.github.io', 'https://patriziopz.github.io/brevettiamo', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Messaggio richiesto' });
    }

    // Risposta di test - senza chiamare Gemini
    res.json({ 
      reply: 'Test OK! Hai scritto: ' + message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ============================================
// CHATBOT - GOOGLE GEMINI (PRIMA di app.listen!)
// ============================================

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Messaggio richiesto' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API Key mancante',
        message: 'Configura GEMINI_API_KEY su Render'
      });
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Sei l assistente AI di BrevettIAmo, piattaforma brevettuale italiana. Rispondi in italiano.' }]
            },
            {
              role: 'model',
              parts: [{ text: 'Ho capito. Sono pronto.' }]
            },
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ 
        error: 'Gemini API error',
        details: data.error.message || 'Errore sconosciuto'
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Errore risposta';

    res.json({ 
      reply: reply,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Errore server',
      message: error.message 
    });
  }
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BrevettIAmo Backend',
    version: '1.0.0',
    intelligenze: 19,
    gemini: process.env.GEMINI_API_KEY ? 'configurato' : 'mancante',
    timestamp: new Date().toISOString()
  });
});

// ========== LISTA 19 SERVIZI ==========
app.get('/api/services/list', async (req, res) => {
  try {
    const { data: config } = await supabase
      .from('config_prezzi')
      .select('dati')
      .eq('id', 'servizi')
      .single();
    
    let services = [
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
    
    if (config && config.dati) {
      const prezziDinamici = config.dati;
      services = services.map(s => {
        const dinamico = prezziDinamici.find(p => p.id === s.id);
        if (dinamico) {
          return {
            ...s,
            prezzo: dinamico.prezzo || s.prezzo,
            credits: dinamico.credits || s.credits,
            attivo: dinamico.attivo !== false
          };
        }
        return s;
      });
    }
    
    res.json({ services, total: 19 });
  } catch (err) {
    console.error('Errore lista servizi:', err);
    res.status(500).json({ error: 'Errore caricamento servizi' });
  }
});

// ========== VERIFICA ABBONAMENTO ==========
async function verificaAbbonamento(userId) {
  if (!userId) return { valido: false, motivo: 'Utente non autenticato' };
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error || !data) {
      return { valido: false, motivo: 'Nessun abbonamento attivo' };
    }
    
    const now = new Date();
    const endDate = new Date(data.current_period_end);
    
    if (endDate < now) {
      return { valido: false, motivo: 'Abbonamento scaduto' };
    }
    
    return { valido: true, piano: data.plan, serviziRimanenti: data.servizi_mese || 0 };
    
  } catch (err) {
    console.error('Errore verifica abbonamento:', err);
    return { valido: false, motivo: 'Errore verifica' };
  }
}

// ========== ESEGUI SERVIZIO AI ==========
app.post('/api/services/execute', async (req, res) => {
  const { serviceId, input, language = 'it', userId } = req.body;

  if (!serviceId || !input) {
    return res.status(400).json({ error: 'serviceId e input richiesti' });
  }

  const abbonamento = await verificaAbbonamento(userId);
  
  if (!abbonamento.valido) {
    return res.status(403).json({
      error: 'Accesso negato',
      message: abbonamento.motivo,
      upgrade: 'https://patriziopz.github.io/brevettiamo/prezzi.html',
      piano: 'Nessun piano attivo'
    });
  }

  const { data: config } = await supabase
    .from('config_prezzi')
    .select('dati')
    .eq('id', 'servizi')
    .single();
  
  if (config && config.dati) {
    const servizioConfig = config.dati.find(s => s.id === serviceId);
    if (servizioConfig && servizioConfig.attivo === false) {
      return res.status(403).json({
        error: 'Servizio disattivato',
        message: 'Questo servizio e temporaneamente non disponibile'
      });
    }
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
        'HTTP-Referer': 'https://patriziopz.github.io',
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

    await supabase.from('service_usage').insert({
      user_id: userId || 'anon',
      service_id: serviceId,
      input: input.substring(0, 500),
      output: result.substring(0, 1000),
      created_at: new Date().toISOString()
    });

    if (userId && abbonamento.valido) {
      await supabase.rpc('decrementa_servizi', { user_id: userId });
    }

    res.json({
      success: true,
      service: serviceId,
      result: result,
      abbonamento: {
        piano: abbonamento.piano,
        serviziRimanenti: abbonamento.serviziRimanenti - 1
      }
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

// ========== CONFIGURAZIONI ADMIN ==========
const configRouter = require('./routes/config-api');
app.use('/api', configRouter);

// ========== AVVIO SERVER (DEVE ESSERE L'ULTIMO!) ==========
app.listen(PORT, () => {
  console.log(`BrevettIAmo 19 Intelligenze - Porta ${PORT}`);
  console.log(`DB: ${process.env.SUPABASE_URL ? 'CONNESSO' : 'MANCANTE'}`);
  console.log(`AI: ${process.env.OPENROUTER_API_KEY ? 'CONNESSA' : 'MANCANTE'}`);
  console.log(`GEMINI: ${process.env.GEMINI_API_KEY ? 'CONFIGURATO' : 'MANCANTE'}`);
});
