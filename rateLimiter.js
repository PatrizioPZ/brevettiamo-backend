// src/middleware/rateLimiter.js
// Rate limiting per proteggere API

const rateLimit = require('express-rate-limit');

// Limite generale API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per IP
  message: {
    error: 'Troppe richieste',
    retryAfter: '15 minuti'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite per servizi AI (piu restrittivo)
const aiServiceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 30, // 30 richieste AI per ora
  message: {
    error: 'Limite servizi AI raggiunto',
    retryAfter: '1 ora',
    upgradeUrl: 'https://patriziopz.github.io/brevettiamo/prezzi.html'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite webhook (molto permissivo per LemonSqueezy)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 1000,
  message: {
    error: 'Troppe richieste webhook'
  }
});

module.exports = {
  generalLimiter,
  aiServiceLimiter,
  webhookLimiter
};