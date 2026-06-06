// src/routes/api/services.js
// Router API per i 19 servizi AI di BrevettIAmo

const express = require('express');
const router = express.Router();
const aiService = require('./ai-service');
const { SERVICE_MAP } = require('./ai-config');
const { supabase, TABLES } = require('./database');
const Joi = require('joi');

// Schema validazione
const serviceRequestSchema = Joi.object({
  serviceId: Joi.number().integer().min(1).max(19).required(),
  input: Joi.string().min(10).max(50000).required(),
  practiceId: Joi.string().uuid().optional(),
  language: Joi.string().valid('it', 'en', 'de', 'fr', 'es', 'cn', 'jp').default('it')
});

// Middleware autenticazione (verifica JWT dal frontend Supabase)
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token non valido' });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Errore autenticazione' });
  }
};

// POST /api/services/execute - Esegue un servizio AI
router.post('/execute', authenticateUser, async (req, res) => {
  try {
    // Validazione input
    const { error, value } = serviceRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Dati non validi', 
        details: error.details 
      });
    }

    const { serviceId, input, practiceId } = value;
    const userId = req.userId;

    // Verifica accesso utente
    const accessCheck = await aiService.checkUserAccess(userId, serviceId);

    if (!accessCheck.allowed) {
      return res.status(403).json({
        error: 'Accesso negato',
        reason: accessCheck.reason,
        upgradeUrl: 'https://patriziopz.github.io/brevettiamo/prezzi.html'
      });
    }

    // Esegui servizio AI
    const result = await aiService.executeService(serviceId, input, userId, practiceId);

    // Incrementa utilizzo
    await aiService.incrementUsage(userId, serviceId);

    res.json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error('Errore esecuzione servizio:', err);
    res.status(500).json({
error: "Errore durante l'elaborazione",
      message: err.message
    });
  }
});

// GET /api/services/list - Lista tutti i servizi disponibili
router.get('/list', async (req, res) => {
  const services = Object.entries(SERVICE_MAP).map(([key, value]) => ({
    id: value.id,
    slug: key,
    name: value.name,
    price: value.price,
    package: value.package
  }));

  res.json({
    success: true,
    count: services.length,
    services: services
  });
});

// GET /api/services/:id - Dettaglio singolo servizio
router.get('/:id', async (req, res) => {
  const serviceId = parseInt(req.params.id);
  const service = Object.entries(SERVICE_MAP).find(([_, v]) => v.id === serviceId);

  if (!service) {
    return res.status(404).json({ error: 'Servizio non trovato' });
  }

  const [key, value] = service;

  res.json({
    success: true,
    service: {
      id: value.id,
      slug: key,
      name: value.name,
      description: getServiceDescription(key),
      price: value.price,
      package: value.package,
      estimatedTime: getEstimatedTime(key),
      outputFormat: getOutputFormat(key)
    }
  });
});

// GET /api/services/history - Storico richieste utente
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.serviceRequests)
      .select(`
        id,
        service_id,
        input_text,
        status,
        created_at,
        completed_at,
        ai_responses (content, tokens_used)
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      history: data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Funzioni helper
function getServiceDescription(key) {
  const descriptions = {
    'prior-art-base': 'Ricerca base di brevetti simili nel database globale',
    'brevettabilita': 'Analisi completa della brevettabilita secondo criteri legali',
    'claims-base': 'Redazione claims indipendenti e dipendenti base',
    'prior-art-avanzata': 'Ricerca avanzata multi-database con classificazione IPC/CPC',
    'claims-pro': 'Redazione claims professionali multi-jurisdizione con fallback',
    'traduzione-claims': 'Traduzione certificata claims in 6 lingue',
    'monitoraggio-concorrenza': 'Monitoraggio mensile competitor e trend brevettuali',
    'consulenza-ai': 'Consulenza personalizzata 1:1 con AI specializzata',
    'analisi-portfolio': 'Analisi qualitativa e strategica di portfolio esistente',
    'fto': 'Analisi Freedom to Operate per prodotti/servizi',
    'descrizione-completa': 'Redazione descrizione brevettuale completa pronta per deposito',
    'disegni-tecnici': 'Specifiche disegni tecnici per brevetto',
    'strategia-deposito': 'Pianificazione strategia deposito internazionale PCT',
    'valutazione-economica': 'Valutazione economica DCF/costo/mercato di brevetti',
    'due-diligence': 'Due diligence IP completa per M&A',
    'contratti-licenza': 'Redazione contratti licenza brevettuale',
    'analisi-invalidita': 'Analisi invalidita e strategia opposizione',
    'gestione-scadenze': 'Gestione calendario scadenze e renewal',
    'cad-professionale': 'Istruzioni disegni CAD professionali per brevetto'
  };
  return descriptions[key] || 'Servizio AI brevettuale';
}

function getEstimatedTime(key) {
  const times = {
    'prior-art-base': '2-3 minuti',
    'brevettabilita': '3-4 minuti',
    'claims-base': '2-3 minuti',
    'prior-art-avanzata': '4-6 minuti',
    'claims-pro': '4-5 minuti',
    'traduzione-claims': '2-3 minuti',
    'monitoraggio-concorrenza': '5-7 minuti',
    'consulenza-ai': '1-2 minuti',
    'analisi-portfolio': '5-8 minuti',
    'fto': '6-10 minuti',
    'descrizione-completa': '8-12 minuti',
    'disegni-tecnici': '3-4 minuti',
    'strategia-deposito': '5-7 minuti',
    'valutazione-economica': '6-10 minuti',
    'due-diligence': '8-15 minuti',
    'contratti-licenza': '5-8 minuti',
    'analisi-invalidita': '6-10 minuti',
    'gestione-scadenze': '3-5 minuti',
    'cad-professionale': '4-6 minuti'
  };
  return times[key] || '3-5 minuti';
}

function getOutputFormat(key) {
  const formats = {
    'prior-art-base': 'Markdown tabellare con lista brevetti',
    'brevettabilita': 'Report strutturato con punteggi e raccomandazioni',
    'claims-base': 'Testo formattato claims standard',
    'prior-art-avanzata': 'Report esecutivo multi-sezione con mappe',
    'claims-pro': 'Documento claims con note strategiche',
    'traduzione-claims': 'Claims tradotti con glossario',
    'monitoraggio-concorrenza': 'Dashboard mensile e report PDF',
    'consulenza-ai': 'Risposta testuale dettagliata',
    'analisi-portfolio': 'Report esecutivo C-level',
    'fto': 'Report legale con claim mapping',
    'descrizione-completa': 'Documento Word-ready',
    'disegni-tecnici': 'Specifiche tecniche per disegnatore',
    'strategia-deposito': 'Roadmap con calendario e budget',
    'valutazione-economica': 'Report valutazione con range',
    'due-diligence': 'Report due diligence completo',
    'contratti-licenza': "Template contratto pronto all'uso",
    'analisi-invalidita': 'Report invalidita con probabilita',
    'gestione-scadenze': 'Calendario e alert system',
    'cad-professionale': 'Istruzioni CAD con stima costi'
  };
  return formats[key] || 'Testo strutturato';
}

module.exports = router;
