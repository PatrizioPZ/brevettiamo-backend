// src/config/database.js
// Configurazione Supabase per BrevettIAmo

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRORE: SUPABASE_URL e SUPABASE_KEY devono essere configurati in .env');
  process.exit(1);
}

// Client anonimo per operazioni frontend
const supabase = createClient(supabaseUrl, supabaseKey);

// Client service role per operazioni backend (webhook, admin)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

// Tabelle principali
const TABLES = {
  users: 'users',
  practices: 'practices',
  services: 'services',
  serviceRequests: 'service_requests',
  aiResponses: 'ai_responses',
  payments: 'payments',
  subscriptions: 'subscriptions',
  usageLogs: 'usage_logs',
  cadFiles: 'cad_files'
};

module.exports = {
  supabase,
  supabaseAdmin,
  TABLES
};