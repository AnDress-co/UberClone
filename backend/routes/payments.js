const crypto = require('node:crypto');
const express = require('express');
const {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  Payment,
  Preference,
  WebhookSignatureValidator,
} = require('mercadopago');
const { FieldValue, db } = require('../firebaseAdmin');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const payments = db.collection('payments');
const trips = db.collection('trips');

function getMercadoPagoClient() {
  if (!process.env.MP_ACCESS_TOKEN) {
    const error = new Error('MP_ACCESS_TOKEN no está configurado en backend/.env.');
    error.statusCode = 503;
    throw error;
  }

  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { timeout: 10000 },
  });
}

function publicUrl(req, path) {
  const base = (process.env.PUBLIC_BACKEND_URL || `${req.protocol}://${req.get('host')}`).trim();
  return `${base.replace(/\/$/, '')}${path}`;
}

function configuredUrl(name, req, fallbackPath, paymentId, tripId) {
  const configured = process.env[name];
  if (!configured) return publicUrl(req, fallbackPath);
  return configured
    .replaceAll('{paymentId}', encodeURIComponent(paymentId))
    .replaceAll('{tripId}', encodeURIComponent(tripId));
}

function appReturnUrl(result, paymentId) {
  const base = process.env.MP_APP_RETURN_URL;
  if (!base) return null;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}status=${encodeURIComponent(result)}&paymentId=${encodeURIComponent(paymentId)}`;
}

function responseBody(response) {
  return response?.body || response;
}

function normalizePaymentStatus(status) {
  if (status === 'approved') return 'approved';
  if (status === 'cancelled') return 'cancelled';
  if (['rejected', 'refunded', 'charged_back'].includes(status)) return 'rejected';
  return 'pending';
}

async function findLocalPayment(paymentId, tripId, preferenceId) {
  if (paymentId) {
    const direct = await payments.doc(paymentId).get();
    if (direct.exists) return { ref: direct.ref, data: direct.data() };
  }

  const snapshot = await payments.where('tripId', '==', tripId).limit(20).get();
  const matching = snapshot.docs.find((doc) => {
    const data = doc.data();
    return preferenceId && data.preferenceId === preferenceId;
  }) || snapshot.docs.find((doc) => doc.data().status === 'pending');

  return matching ? { ref: matching.ref, data: matching.data() } : null;
}

async function applyValidatedPayment(paymentResource) {
  const tripId = String(paymentResource.external_reference || '');
  const mercadopagoPaymentId = String(paymentResource.id || '');
  const preferenceId = paymentResource.preference_id || paymentResource.order?.id;

  if (!tripId || !mercadopagoPaymentId) {
    const error = new Error('La notificación no contiene external_reference o id.');
    error.statusCode = 400;
    throw error;
  }

  const localPayment = await findLocalPayment(
    paymentResource.metadata?.payment_id,
    tripId,
    preferenceId
  );
  if (!localPayment) {
    const error = new Error('No existe un pago local para el viaje notificado.');
    error.statusCode = 404;
    throw error;
  }

  const amount = Number(paymentResource.transaction_amount);
  if (!Number.isFinite(amount) || Math.abs(amount - Number(localPayment.data.amount)) > 0.01) {
    const error = new Error('El monto del pago no coincide con el monto local.');
    error.statusCode = 400;
    throw error;
  }
  if (paymentResource.currency_id && paymentResource.currency_id !== localPayment.data.currency) {
    const error = new Error('La moneda del pago no coincide con la moneda local.');
    error.statusCode = 400;
    throw error;
  }

  const status = normalizePaymentStatus(paymentResource.status);
  const paymentRef = localPayment.ref;
  const tripRef = trips.doc(tripId);

  await db.runTransaction(async (transaction) => {
    const tripSnap = await transaction.get(tripRef);
    if (!tripSnap.exists) throw Object.assign(new Error('TRIP_NOT_FOUND'), { statusCode: 404 });

    transaction.update(paymentRef, {
      mercadopagoPaymentId,
      providerStatus: paymentResource.status || null,
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (tripSnap.data().status === 'paid') return;

    transaction.update(tripRef, {
      ...(status === 'approved'
        ? {
            paymentStatus: 'approved',
            paymentId: mercadopagoPaymentId,
            status: 'paid',
            paidAt: FieldValue.serverTimestamp(),
          }
        : { paymentStatus: status }),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { status, tripId, paymentId: mercadopagoPaymentId };
}

router.post('/payments/preference', requireAuth, async (req, res, next) => {
  try {
    const { tripId, amount } = req.body || {};
    if (!tripId || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'INVALID_PAYMENT_DATA' });
    }

    const tripRef = trips.doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) return res.status(404).json({ error: 'TRIP_NOT_FOUND' });

    const trip = tripSnap.data();
    if (trip.driverId !== req.user.uid) {
      return res.status(403).json({ error: 'TRIP_NOT_ASSIGNED_TO_DRIVER' });
    }
    if (trip.status === 'paid') {
      return res.status(409).json({ error: 'TRIP_ALREADY_PAID' });
    }
    if (Math.abs(Number(amount) - Number(trip.fare)) > 0.01) {
      return res.status(400).json({ error: 'PAYMENT_AMOUNT_MISMATCH' });
    }

    const paymentId = crypto.randomUUID();
    const paymentRef = payments.doc(paymentId);
    await paymentRef.set({
      tripId,
      driverId: req.user.uid,
      amount: Number(trip.fare),
      currency: trip.currency || 'COP',
      status: 'pending',
      provider: 'mercadopago',
      createdAt: FieldValue.serverTimestamp(),
    });

    const preferenceResponse = await new Preference(getMercadoPagoClient()).create({
      body: {
        items: [{
          id: tripId,
          title: `Viaje UberClone ${tripId}`,
          quantity: 1,
          unit_price: Number(trip.fare),
          currency_id: trip.currency || 'COP',
        }],
        external_reference: tripId,
        metadata: { payment_id: paymentId, trip_id: tripId },
        notification_url: (process.env.MP_WEBHOOK_URL || publicUrl(req, '/payments/webhook')).trim(),
        back_urls: {
          success: configuredUrl('MP_BACK_URL_SUCCESS', req, `/payments/return/${paymentId}?result=approved`, paymentId, tripId),
          failure: configuredUrl('MP_BACK_URL_FAILURE', req, `/payments/return/${paymentId}?result=rejected`, paymentId, tripId),
          pending: configuredUrl('MP_BACK_URL_PENDING', req, `/payments/return/${paymentId}?result=pending`, paymentId, tripId),
        },
        auto_return: 'approved',
      },
    });

    const preference = responseBody(preferenceResponse);
    await paymentRef.update({
      preferenceId: preference.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      id: paymentId,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      init_point: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point || preference.init_point,
      sandbox_init_point: preference.sandbox_init_point || preference.init_point,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/payments/webhook', async (req, res, next) => {
  try {
    if (process.env.MP_WEBHOOK_SECRET) {
      try {
        WebhookSignatureValidator.validate({
          xSignature: req.get('x-signature'),
          xRequestId: req.get('x-request-id'),
          dataId: req.query['data.id'],
          secret: process.env.MP_WEBHOOK_SECRET,
          toleranceSeconds: 300,
        });
      } catch (error) {
        if (error instanceof InvalidWebhookSignatureError) {
          return res.status(401).json({ error: 'INVALID_WEBHOOK_SIGNATURE' });
        }
        throw error;
      }
    }

    if (req.body?.type && req.body.type !== 'payment') return res.status(200).json({ received: true });

    const notificationId = req.body?.data?.id || req.query['data.id'] || req.body?.id;
    if (!notificationId) return res.status(400).json({ error: 'PAYMENT_ID_REQUIRED' });

    const paymentResponse = await new Payment(getMercadoPagoClient()).get({ id: String(notificationId) });
    const payment = responseBody(paymentResponse);
    const result = await applyValidatedPayment(payment);
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    return next(error);
  }
});

router.get('/payments/return/:paymentId', (req, res) => {
  const result = ['approved', 'rejected', 'pending', 'cancelled'].includes(req.query.result)
    ? req.query.result
    : 'pending';
  const deepLink = appReturnUrl(result, req.params.paymentId);
  if (deepLink) return res.redirect(302, deepLink);
  const label = {
    approved: 'aprobado',
    rejected: 'rechazado',
    cancelled: 'cancelado',
    pending: 'pendiente',
  }[result];
  return res.type('html').send(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mercado Pago</title><body style="font-family:Arial;max-width:420px;margin:40px auto;padding:20px"><h1>Pago ${label}</h1><p>Vuelve a la aplicación. El estado se actualiza automáticamente.</p></body></html>`);
});

module.exports = router;
