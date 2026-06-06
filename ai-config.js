// ai-config.js - Configurazione AI per BrevettIAmo
module.exports = {
    // Kimi API (Moonshot AI) - Free tier: 1M tokens/month
    KIMI_API_KEY: process.env.KIMI_API_KEY || '',
    KIMI_API_URL: 'https://api.moonshot.cn/v1',
    
    // OpenRouter (alternativa gratuita)
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    OPENROUTER_API_URL: 'https://openrouter.ai/api/v1',
    
    // Configurazione default
    DEFAULT_MODEL: 'kimi-latest',
    MAX_TOKENS: 4096,
    TEMPERATURE: 0.7,
    
    // Servizi AI disponibili
    SERVICES: {
        patentDraft: true,
        patentSearch: true,
        svgGenerator: true,
        pdfGenerator: true,
        techAnalysis: true,
        legalCheck: true
    }
};
