// src/routes/api/webhook.js
// Webhook per ricevere eventi da LemonSqueezy

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabaseAdmin, TABLES } = require('../../config/database');

// Verifica firma webhook LemonSqueezy
const verifyWebhook = (req, res, next) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];

  if (!secret || !signature) {
    return res.status(401).json({ error: 'Firma mancante' });
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== hash) {
    return res.status(401).json({ error: 'Firma non valida' });
  }

  next();
};

// POST /api/webhook/lemonsqueezy
router.post('/lemonsqueezy', verifyWebhook, async (req, res) => {
  try {
    const event = req.body;
    const eventType = event.meta?.event_name;
    const attributes = event.data?.attributes;
    const customData = event.meta?.custom_data || {};
    const userId = customData.user_id;
    const userEmail = customData.user_email;

    console.log(`Webhook ricevuto: ${eventType}`, { userId, userEmail });

    switch (eventType) {
      case 'order_created':
      case 'subscription_created':
        await handleSubscriptionCreated(event, userId, userEmail);
        break;

      case 'subscription_updated':
        await handleSubscriptionUpdated(event, userId);
        break;

      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event, userId);
        break;

      case 'subscription_expired':
        await handleSubscriptionExpired(event, userId);
        break;

      case 'subscription_payment_success':
        await handlePaymentSuccess(event, userId);
        break;

      case 'subscription_payment_failed':
        await handlePaymentFailed(event, userId);
        break;

      default:
        console.log(`Evento non gestito: ${eventType}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Errore webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

// Gestori eventi
async function handleSubscriptionCreated(event, userId, userEmail) {
  const attributes = event.data.attributes;
  const variantId = attributes.first_order_item?.variant_id;

  // Mappa variant ID -> piano
  const planMap = {
    // Inserisci qui i tuoi variant ID reali da LemonSqueezy
    'starter-variant-id': 'starter',
    'pro-variant-id': 'pro', 
    'enterprise-variant-id': 'enterprise'
  };

  const planType = planMap[variantId] || 'starter';
  const subscriptionId = event.data.id;
  const status = attributes.status;
  const currentPeriodStart = attributes.created_at;
  const currentPeriodEnd = attributes.renews_at || attributes.ends_at;

  // Salva su Supabase
  const { error } = await supabaseAdmin
    .from(TABLES.subscriptions)
    .upsert({
      id: subscriptionId,
      user_id: userId,
      user_email: userEmail,
      plan_type: planType,
      status: status,
      lemonsqueezy_id: subscriptionId,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) throw error;

  // Salva anche il pagamento
  await supabaseAdmin.from(TABLES.payments).insert({
    id: event.data.id,
    user_id: userId,
    subscription_id: subscriptionId,
    amount: attributes.total,
    currency: attributes.currency,
    status: 'completed',
    payment_method: 'lemonsqueezy',
    created_at: new Date().toISOString()
  });

  console.log(`Abbonamento ${planType} creato per utente ${userId}`);
}

async function handleSubscriptionUpdated(event, userId) {
  const attributes = event.data.attributes;
  const subscriptionId = event.data.id;

  await supabaseAdmin
    .from(TABLES.subscriptions)
    .update({
      status: attributes.status,
      current_period_end: attributes.renews_at || attributes.ends_at,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId);
}

async function handleSubscriptionCancelled(event, userId) {
  const subscriptionId = event.data.id;

  await supabaseAdmin
    .from(TABLES.subscriptions)
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId);
}

async function handleSubscriptionExpired(event, userId) {
  const subscriptionId = event.data.id;

  await supabaseAdmin
    .from(TABLES.subscriptions)
    .update({
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId);
}

async function handlePaymentSuccess(event, userId) {
  const attributes = event.data.attributes;

  await supabaseAdmin.from(TABLES.payments).insert({
    id: event.data.id,
    user_id: userId,
    subscription_id: attributes.subscription_id,
    amount: attributes.total,
    currency: attributes.currency,
    status: 'completed',
    payment_method: 'lemonsqueezy',
    created_at: new Date().toISOString()
  });
}

async function handlePaymentFailed(event, userId) {
  const attributes = event.data.attributes;

  await supabaseAdmin.from(TABLES.payments).insert({
    id: event.data.id,
    user_id: userId,
    subscription_id: attributes.subscription_id,
    amount: attributes.total,
    currency: attributes.currency,
    status: 'failed',
    payment_method: 'lemonsqueezy',
    error_message: attributes.error_message,
    created_at: new Date().toISOString()
  });
}

module.exports = router;