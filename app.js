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


app.get('/chatbot', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chatbot BrevettIAmo</title>
<style>
body{font-family:'Segoe UI',system-ui,sans-serif;background:#f1f5f9;min-height:100vh;display:flex;justify-content:center;align-items:center;margin:0}
.chat-container{width:100%;max-width:400px;height:600px;background:#fff;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);display:flex;flex-direction:column;overflow:hidden}
.chat-header{background:#2563eb;color:#fff;padding:1rem;display:flex;align-items:center;gap:0.75rem}
.chat-header .avatar{width:40px;height:40px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem}
.chat-header h3{font-size:1rem;font-weight:600;margin:0}
.chat-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;background:#f8fafc}
.message{max-width:85%;padding:0.75rem 1rem;border-radius:16px;font-size:0.9rem;line-height:1.4}
.message.user{align-self:flex-end;background:#2563eb;color:#fff;border-bottom-right-radius:4px}
.message.bot{align-self:flex-start;background:#fff;color:#1e293b;border-bottom-left-radius:4px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
.chat-input{padding:1rem;border-top:1px solid #e2e8f0;display:flex;gap:0.5rem}
.chat-input input{flex:1;padding:0.75rem 1rem;border:2px solid #e2e8f0;border-radius:12px;font-size:0.9rem;outline:none}
.chat-input input:focus{border-color:#2563eb}
.chat-input button{padding:0.75rem 1rem;background:#2563eb;color:#fff;border:none;border-radius:12px;cursor:pointer}
.welcome{text-align:center;padding:1.5rem;color:#64748b;font-size:0.85rem;background:#fff;border-radius:12px;margin-bottom:0.5rem}
.welcome .icon{font-size:2.5rem;margin-bottom:0.75rem;display:block}
</style>
</head>
<body>
<div class="chat-container">
<div class="chat-header">
<div class="avatar">🤖</div>
<div>
<h3>BrevettIAmo AI</h3>
<div style="font-size:0.8rem;opacity:0.9">Online</div>
</div>
</div>
<div class="chat-messages" id="chatMessages">
<div class="welcome">
<span class="icon">🛡️</span>
<h4 style="color:#1e293b;margin-bottom:0.5rem">Ciao! Sono l'assistente AI di BrevettIAmo</h4>
<p>Posso aiutarti con brevetti, marchi, design e ricerche anteriorita.</p>
</div>
</div>
<div class="chat-input">
<input type="text" id="chatInput" placeholder="Scrivi un messaggio..." onkeypress="if(event.key==='Enter')sendMessage()">
<button onclick="sendMessage()">➤</button>
</div>
</div>
<script>
function addMessage(text, isUser) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'message ' + (isUser ? 'user' : 'bot');
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMessage(text, true);

  try {
    const response = await fetch('https://brevettiamo-backend.onrender.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await response.json();
    if (data.reply) {
      addMessage(data.reply, false);
    } else {
      addMessage('Errore: ' + (data.error || 'Risposta non valida'), false);
    }
  } catch (e) {
    addMessage('Errore di connessione. Riprova tra poco.', false);
  }
}
</script>
</body>
</html>`);
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
       Fix modello OpenRouter - mistral-7b-instruct:free
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

// ============================================
// CHATBOT - OPENROUTER (usando key già configurata)
// ============================================

app.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Messaggio richiesto' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'OpenRouter API Key mancante',
        message: 'Configura OPENROUTER_API_KEY su Render'
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://patriziopz.github.io',
        'X-Title': 'BrevettIAmo'
      },
      body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'Sei l assistente AI di BrevettIAmo, piattaforma italiana per gestione pratiche brevettuali. Rispondi in italiano, professionale ma accessibile.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error('OpenRouter error: ' + response.status);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Errore risposta';

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
// ========== AVVIO SERVER (DEVE ESSERE L'ULTIMO!) ==========
app.listen(PORT, () => {
  console.log(`BrevettIAmo 19 Intelligenze - Porta ${PORT}`);
  console.log(`DB: ${process.env.SUPABASE_URL ? 'CONNESSO' : 'MANCANTE'}`);
  console.log(`AI: ${process.env.OPENROUTER_API_KEY ? 'CONNESSA' : 'MANCANTE'}`);
  console.log(`GEMINI: ${process.env.GEMINI_API_KEY ? 'CONFIGURATO' : 'MANCANTE'}`);
});
