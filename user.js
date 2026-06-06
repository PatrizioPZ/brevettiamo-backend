// src/routes/api/user.js
// Gestione utente, abbonamento e utilizzo

const express = require('express');
const router = express.Router();
const { supabase, TABLES } = require('../../config/database');
const { PACKAGES } = require('../../config/ai-config');

// Middleware auth
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.substring(7));
    if (error || !user) return res.status(401).json({ error: 'Token non valido' });
    req.userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Errore autenticazione' });
  }
};

// GET /api/user/profile - Profilo utente con abbonamento
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    // Recupera abbonamento attivo
    const { data: subscription } = await supabase
      .from(TABLES.subscriptions)
      .select('*')
      .eq('user_id', req.userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Recupera utilizzo del periodo corrente
    let usageCount = 0;
    if (subscription) {
      const { data: usage } = await supabase
        .from(TABLES.usageLogs)
        .select('count', { count: 'exact' })
        .eq('user_id', req.userId)
        .gte('created_at', subscription.current_period_start)
        .single();
      usageCount = usage?.count || 0;
    }

    const planType = subscription?.plan_type || 'free';
    const plan = PACKAGES[planType] || { name: 'Free', services: 0, price: 0 };

    res.json({
      success: true,
      user: {
        id: req.userId,
        subscription: subscription ? {
          plan: planType,
          planName: plan.name,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          maxServices: plan.services,
          usedServices: usageCount,
          remainingServices: Math.max(0, plan.services - usageCount)
        } : null,
        isActive: !!subscription && subscription.status === 'active'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/usage - Statistiche utilizzo
router.get('/usage', authenticateUser, async (req, res) => {
  try {
    const { data: logs } = await supabase
      .from(TABLES.usageLogs)
      .select(`
        service_id,
        created_at,
        service_requests (service_id)
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Aggrega per servizio
    const byService = {};
    logs?.forEach(log => {
      const sid = log.service_id;
      byService[sid] = (byService[sid] || 0) + 1;
    });

    res.json({
      success: true,
      totalRequests: logs?.length || 0,
      byService: byService,
      recentActivity: logs?.slice(0, 10) || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/payments - Storico pagamenti
router.get('/payments', authenticateUser, async (req, res) => {
  try {
    const { data: payments } = await supabase
      .from(TABLES.payments)
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    res.json({
      success: true,
      payments: payments || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;