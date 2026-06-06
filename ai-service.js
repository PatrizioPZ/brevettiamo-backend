// src/services/ai-service.js
// Servizio principale per chiamate AI (OpenRouter) - 19 servizi

const axios = require('axios');
const { AI_CONFIG, SYSTEM_PROMPTS, SERVICE_MAP } = require('../config/ai-config');
const { supabase, TABLES } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AIService {
  constructor() {
    this.apiKey = AI_CONFIG.apiKey;
    this.apiUrl = AI_CONFIG.apiUrl;
    this.model = AI_CONFIG.model;
    this.maxTokens = AI_CONFIG.maxTokens;
    this.temperature = AI_CONFIG.temperature;
    this.headers = AI_CONFIG.headers;
  }

  /**
   * Chiama OpenRouter API con il system prompt appropriato
   */
  async callAIAPI(systemPrompt, userMessage, conversationHistory = []) {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY non configurata. Ottienila su openrouter.ai');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          top_p: AI_CONFIG.topP
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': this.headers['HTTP-Referer'],
            'X-Title': this.headers['X-Title']
          },
          timeout: 60000
        }
      );

      if (response.data && response.data.choices && response.data.choices[0]) {
        return {
          success: true,
          content: response.data.choices[0].message.content,
          usage: response.data.usage || {},
          model: this.model
        };
      }

      throw new Error('Risposta API non valida');
    } catch (error) {
      console.error('Errore OpenRouter API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        content: null
      };
    }
  }

  /**
   * Esegue un servizio AI specifico
   */
  async executeService(serviceId, userInput, userId, practiceId = null) {
    const serviceKey = Object.keys(SERVICE_MAP).find(
      key => SERVICE_MAP[key].id === parseInt(serviceId)
    );

    if (!serviceKey) {
      throw new Error(`Servizio ID ${serviceId} non trovato`);
    }

    const service = SERVICE_MAP[serviceKey];
    const systemPrompt = SYSTEM_PROMPTS[serviceKey];

    if (!systemPrompt) {
      throw new Error(`System prompt non trovato per servizio ${serviceKey}`);
    }

    // Log della richiesta
    const requestId = uuidv4();
    await this.logRequest(requestId, userId, service.id, userInput, practiceId);

    // Chiama OpenRouter API
    const aiResponse = await this.callAIAPI(systemPrompt, userInput);

    if (aiResponse.success) {
      // Salva la risposta
      await this.saveResponse(requestId, aiResponse.content, aiResponse.usage);

      return {
        success: true,
        requestId: requestId,
        service: service.name,
        content: aiResponse.content,
        usage: aiResponse.usage,
        timestamp: new Date().toISOString()
      };
    } else {
      await this.saveResponse(requestId, null, null, aiResponse.error);
      throw new Error(aiResponse.error);
    }
  }

  /**
   * Log della richiesta su Supabase
   */
  async logRequest(requestId, userId, serviceId, input, practiceId) {
    try {
      await supabase.from(TABLES.serviceRequests).insert({
        id: requestId,
        user_id: userId,
        service_id: serviceId,
        practice_id: practiceId,
        input_text: input.substring(0, 10000),
        status: 'processing',
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Errore log richiesta:', err.message);
    }
  }

  /**
   * Salva la risposta AI su Supabase
   */
  async saveResponse(requestId, content, usage, error = null) {
    try {
      await supabase.from(TABLES.aiResponses).insert({
        id: uuidv4(),
        request_id: requestId,
        content: content,
        tokens_used: usage?.total_tokens || 0,
        prompt_tokens: usage?.prompt_tokens || 0,
        completion_tokens: usage?.completion_tokens || 0,
        error: error,
        created_at: new Date().toISOString()
      });

      await supabase
        .from(TABLES.serviceRequests)
        .update({ 
          status: error ? 'error' : 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

    } catch (err) {
      console.error('Errore salva risposta:', err.message);
    }
  }

  /**
   * Verifica se l'utente ha accesso al servizio
   */
  async checkUserAccess(userId, serviceId) {
    try {
      const { data: subscription } = await supabase
        .from(TABLES.subscriptions)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!subscription) {
        return { allowed: false, reason: 'Nessun abbonamento attivo' };
      }

      const packageType = subscription.plan_type;
      const service = Object.values(SERVICE_MAP).find(s => s.id === parseInt(serviceId));

      if (!service) {
        return { allowed: false, reason: 'Servizio non valido' };
      }

      const packageServices = require('../config/ai-config').PACKAGES[packageType]?.serviceIds || [];

      if (!packageServices.includes(service.id)) {
        return { 
          allowed: false, 
          reason: `Servizio non incluso nel pacchetto ${packageType}. Aggiorna a ${service.package}` 
        };
      }

      const { data: usage } = await supabase
        .from(TABLES.usageLogs)
        .select('count')
        .eq('user_id', userId)
        .gte('created_at', subscription.current_period_start)
        .single();

      const usedServices = usage?.count || 0;
      const maxServices = require('../config/ai-config').PACKAGES[packageType]?.services || 0;

      if (usedServices >= maxServices) {
        return { allowed: false, reason: 'Limite servizi mensile raggiunto' };
      }

      return { allowed: true, subscription };
    } catch (err) {
      console.error('Errore verifica accesso:', err.message);
      return { allowed: false, reason: 'Errore di verifica' };
    }
  }

  /**
   * Incrementa contatore utilizzo
   */
  async incrementUsage(userId, serviceId) {
    try {
      await supabase.from(TABLES.usageLogs).insert({
        id: uuidv4(),
        user_id: userId,
        service_id: serviceId,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Errore incremento utilizzo:', err.message);
    }
  }
}

module.exports = new AIService();