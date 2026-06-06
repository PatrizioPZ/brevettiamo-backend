// config/database.js - Configurazione Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = {
    pratiche: 'pratiche',
    utenti: 'utenti',
    pagamenti: 'pagamenti',
    figure: 'figure',
    scadenze: 'scadenze'
};

module.exports = { supabase, TABLES };
