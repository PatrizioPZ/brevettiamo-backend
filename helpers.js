// src/utils/helpers.js
// Utility per BrevettIAmo Backend

/**
 * Formatta prezzo in EUR
 */
function formatPrice(amount, currency = 'EUR') {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Tronca testo a N caratteri
 */
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Genera ID univoco (fallback se uuid non disponibile)
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Valida email
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Calcola tempo di lettura stimato (parole/minuto)
 */
function estimateReadingTime(text, wpm = 200) {
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / wpm);
  return minutes;
}

/**
 * Sanitizza input utente (previene XSS)
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Formatta data in italiano
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcola differenza giorni tra due date
 */
function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Genera slug da stringa
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Conta token approssimativo (1 token ~ 4 caratteri)
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Verifica se una stringa e vuota o solo spazi
 */
function isEmpty(str) {
  return !str || str.trim().length === 0;
}

/**
 * Genera messaggio di errore user-friendly
 */
function getErrorMessage(error) {
  const errorMap = {
    'KIMI_API_KEY non configurata': 'Servizio AI temporaneamente non disponibile. Contatta supporto.',
    'Token non valido': 'Sessione scaduta. Effettua nuovo login.',
    'Nessun abbonamento attivo': 'Abbonamento richiesto. Scegli un piano su Prezzi.',
    'Limite servizi mensile raggiunto': 'Hai raggiunto il limite mensile. Aggiorna il piano.',
    'Servizio non incluso': 'Servizio non disponibile nel tuo piano. Aggiorna per accedere.'
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) return value;
  }

  return 'Si e verificato un errore. Riprova piu tardi.';
}

module.exports = {
  formatPrice,
  truncateText,
  generateId,
  isValidEmail,
  estimateReadingTime,
  sanitizeInput,
  formatDate,
  daysBetween,
  slugify,
  estimateTokens,
  isEmpty,
  getErrorMessage
};