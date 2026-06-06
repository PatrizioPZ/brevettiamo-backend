// ai-config.js - Configurazione AI per BrevettIAmo
// Compatibile con ai-service.js (riga 5: const { AI_CONFIG, SYSTEM_PROMPTS, SERVICE_MAP } = require('./ai-config'))

const AI_CONFIG = {
    apiKey: process.env.OPENROUTER_API_KEY || process.env.KIMI_API_KEY || '',
    apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
    model: process.env.AI_MODEL || 'openrouter/auto',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    headers: {
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://patrizioz.github.io',
        'X-Title': 'BrevettIAmo'
    }
};

const SYSTEM_PROMPTS = {
    patentDraft: 'Sei un esperto di proprietà intellettuale italiano. Genera una descrizione brevettuale professionale in italiano conforme agli standard UIBM. Includi: campo tecnico, stato dell\'arte, descrizione dettagliata, rivendicazioni, figure tecniche.',
    patentSearch: 'Sei un ricercatore brevetti specializzato. Analizza la novità e l\'inventività dell\'invenzione proposta. Cerca brevetti simili in database globali (USPTO, EPO, WIPO, UIBM). Fornisci report di anteriorità.',
    svgGenerator: 'Genera SVG tecnici professionali per disegni di brevetto. Usa linee precise, quote, sezioni, viste multiple. Formato vettoriale scalabile conforme standard UIBM.',
    techAnalysis: 'Analisi tecnica approfondita dello stato dell\'arte. Identifica tecnologie correlate, gap tecnologici, vantaggi competitivi. Valuta fattibilità industriale.',
    legalCheck: 'Verifica legale conformità UIBM. Controlla: requisiti di brevettabilità (novità, inventività, applicabilità industriale), formalità deposito, classificazione IPC/CPC, possibili conflitti.'
};

const SERVICE_MAP = {
    patentDraft: 'patent_draft',
    patentSearch: 'patent_search',
    svgGenerator: 'svg_generator',
    techAnalysis: 'tech_analysis',
    legalCheck: 'legal_check',
    pdfGenerator: 'pdf_generator',
    claimAnalysis: 'claim_analysis',
    priorArtSearch: 'prior_art_search',
    patentTranslation: 'patent_translation',
    technicalDrawing: 'technical_drawing',
    ipcClassification: 'ipc_classification',
    patentMonitoring: 'patent_monitoring',
    freedomToOperate: 'freedom_to_operate',
    patentValuation: 'patent_valuation',
    licensingAgreement: 'licensing_agreement',
    infringementAnalysis: 'infringement_analysis',
    patentPortfolio: 'patent_portfolio',
    renewalManagement: 'renewal_management'
};

module.exports = { AI_CONFIG, SYSTEM_PROMPTS, SERVICE_MAP };
