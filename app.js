// src/app.js
// Entry point BrevettIAmo Backend - 19 Servizi AI + CAD

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { generalLimiter, aiServiceLimiter, webhookLimiter } = require('./rateLimiter');
const servicesRouter = require('./services');
const webhookRouter = require('./webhook');
const userRouter = require('./user');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://patriziopz.github.io';

// Middleware sicurezza
app.use(helmet());
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting generale
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BrevettIAmo Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiServices: 19,
    aiProvider: 'OpenRouter',
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/services', aiServiceLimiter, servicesRouter);
app.use('/api/webhook', webhookLimiter, webhookRouter);
app.use('/api/user', generalLimiter, userRouter);

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'BrevettIAmo Backend API',
    version: '1.0.0',
    description: '19 servizi AI per proprieta intellettuale via OpenRouter',
    endpoints: {
      health: 'GET /health',
      services: {
        list: 'GET /api/services/list',
        detail: 'GET /api/services/:id',
        execute: 'POST /api/services/execute',
        history: 'GET /api/services/history'
      },
      user: {
        profile: 'GET /api/user/profile',
        usage: 'GET /api/user/usage',
        payments: 'GET /api/user/payments'
      },
      webhook: {
        lemonsqueezy: 'POST /api/webhook/lemonsqueezy'
      }
    },
    documentation: 'https://patriziopz.github.io/brevettiamo',
    status: 'operational'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint non trovato',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Errore server:', err);
  res.status(500).json({
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Contatta supporto'
  });
});

app.listen(PORT, () => {
  console.log(`
  ============================================
   BREVETTIAMO BACKEND - 19 Servizi AI + CAD
  ============================================
  Server avviato su porta: ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Frontend: ${FRONTEND_URL}

  Endpoints disponibili:
  - GET  /health          (health check)
  - GET  /api/services/list    (lista 19 servizi)
  - POST /api/services/execute (esegui servizio AI)
  - GET  /api/user/profile     (profilo utente)
  - POST /api/webhook/lemonsqueezy (pagamenti)

  AI Provider: OpenRouter (https://openrouter.ai)
  Modello: ${process.env.OPENROUTER_MODEL || 'moonshot-ai/moonshot-v1-8k'}
  Stato AI: ${process.env.OPENROUTER_API_KEY ? 'CONNESSA' : 'NON CONFIGURATA - Ottieni API key su openrouter.ai/keys'}
  Stato DB: ${process.env.SUPABASE_URL ? 'CONNESSO (Supabase)' : 'NON CONFIGURATO'}

  ============================================
  `);
});

module.exports = app;
