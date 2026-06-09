// ============================================
// BREVETTIAMO - API CONFIGURAZIONI ADMIN
// Gestione prezzi, variabili, impostazioni
// ============================================

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

router.get('/config', async (req, res) => {
    try {
        const { categoria } = req.query;
        let query = supabase.from('config_prezzi').select('chiave, valore, tipo, descrizione, categoria').eq('visibile_admin', true);
        if (categoria) query = query.eq('categoria', categoria);
        const { data, error } = await query.order('categoria').order('chiave');
        if (error) return res.status(500).json({ error: error.message });
        const config = {};
        data.forEach(item => {
            let valore;
            switch(item.tipo) {
                case 'number': valore = parseFloat(item.valore) || 0; break;
                case 'boolean': valore = item.valore === 'true'; break;
                case 'json': case 'array': try { valore = JSON.parse(item.valore); } catch(e) { valore = item.valore; } break;
                default: valore = item.valore;
            }
            config[item.chiave] = valore;
        });
        res.json({ success: true, config, count: data.length });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/config/:chiave', async (req, res) => {
    try {
        const { chiave } = req.params;
        const { data, error } = await supabase.from('config_prezzi').select('chiave, valore, tipo, descrizione, categoria').eq('chiave', chiave).eq('visibile_admin', true).single();
        if (error) return res.status(404).json({ error: 'Configurazione non trovata' });
        let valore;
        switch(data.tipo) {
            case 'number': valore = parseFloat(data.valore) || 0; break;
            case 'boolean': valore = data.valore === 'true'; break;
            case 'json': case 'array': try { valore = JSON.parse(data.valore); } catch(e) { valore = data.valore; } break;
            default: valore = data.valore;
        }
        res.json({ success: true, chiave: data.chiave, valore, tipo: data.tipo, descrizione: data.descrizione, categoria: data.categoria });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/config/batch', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Autenticazione richiesta' });
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Token non valido' });
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') return res.status(403).json({ error: 'Accesso negato. Solo admin.' });
        const { updates } = req.body;
        if (!Array.isArray(updates)) return res.status(400).json({ error: 'Body deve contenere array "updates"' });
        const results = [];
        for (const update of updates) {
            const { chiave, valore } = update;
            if (!chiave || valore === undefined) { results.push({ chiave, success: false, error: 'Chiave e valore obbligatori' }); continue; }
            const { data: existing } = await supabase.from('config_prezzi').select('modificabile_admin').eq('chiave', chiave).single();
            if (existing && !existing.modificabile_admin) { results.push({ chiave, success: false, error: 'Chiave non modificabile' }); continue; }
            const { error } = await supabase.from('config_prezzi').update({ valore: valore.toString(), updated_at: new Date().toISOString() }).eq('chiave', chiave);
            results.push({ chiave, success: !error, error: error?.message });
        }
        res.json({ success: true, results, aggiornati: results.filter(r => r.success).length });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/config/servizi-attivi', async (req, res) => {
    try {
        const { data, error } = await supabase.from('config_prezzi').select('chiave, valore, tipo').in('categoria', ['pacchetti', 'servizi']).eq('visibile_admin', true);
        if (error) return res.status(500).json({ error: error.message });
        const pacchetti = {}; const servizi = {};
        data.forEach(item => {
            const valore = item.tipo === 'number' ? parseFloat(item.valore) : item.tipo === 'boolean' ? item.valore === 'true' : item.valore;
            if (item.chiave.includes('pacchetto_')) {
                const nome = item.chiave.replace('pacchetto_', '').replace('_prezzo', '').replace('_attivo', '');
                if (!pacchetti[nome]) pacchetti[nome] = {};
                if (item.chiave.includes('_prezzo')) pacchetti[nome].prezzo = valore;
                if (item.chiave.includes('_attivo')) pacchetti[nome].attivo = valore;
            }
            if (item.chiave.includes('servizio_')) {
                const nome = item.chiave.replace('servizio_', '').replace('_prezzo', '').replace('_attivo', '');
                if (!servizi[nome]) servizi[nome] = {};
                if (item.chiave.includes('_prezzo')) servizi[nome].prezzo = valore;
                if (item.chiave.includes('_attivo')) servizi[nome].attivo = valore;
            }
        });
        const pacchettiAttivi = Object.entries(pacchetti).filter(([_, d]) => d.attivo !== false).reduce((a, [n, d]) => { a[n] = d; return a; }, {});
        const serviziAttivi = Object.entries(servizi).filter(([_, d]) => d.attivo !== false).reduce((a, [n, d]) => { a[n] = d; return a; }, {});
        res.json({ success: true, pacchetti: pacchettiAttivi, servizi: serviziAttivi, iva: parseFloat(data.find(c => c.chiave === 'sito_iva_percentuale')?.valore || 22) });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
