const crypto = require('node:crypto');
const express = require('express');
const { FieldValue, db } = require('../firebaseAdmin');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const payments = db.collection('payments');
const trips = db.collection('trips');

function publicUrl(req, path) {
  const base = process.env.PUBLIC_BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}${path}`;
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

    const paymentId = crypto.randomUUID();
    await payments.doc(paymentId).set({
      tripId,
      driverId: req.user.uid,
      amount: Number(amount),
      currency: 'COP',
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      id: paymentId,
      initPoint: publicUrl(req, `/payments/checkout/${paymentId}`),
      init_point: publicUrl(req, `/payments/checkout/${paymentId}`),
      sandbox_init_point: publicUrl(req, `/payments/checkout/${paymentId}`),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/payments/checkout/:paymentId', async (req, res, next) => {
  try {
    const paymentSnap = await payments.doc(req.params.paymentId).get();
    if (!paymentSnap.exists) return res.status(404).send('Pago no encontrado.');

    const payment = paymentSnap.data();
    const amount = new Intl.NumberFormat('es-CO').format(payment.amount);
    const action = (status) => `/payments/checkout/${req.params.paymentId}/${status}`;

    return res.type('html').send(`<!doctype html>
      <html lang="es">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Pago simulado</title>
        <style>body{font-family:Arial;max-width:420px;margin:40px auto;padding:20px}button{padding:12px;margin:6px 0;width:100%;border:0;border-radius:6px;cursor:pointer}.ok{background:#16a34a;color:#fff}.no{background:#dc2626;color:#fff}</style>
        </head>
        <body><h1>Pago simulado</h1><p>Viaje: ${payment.tripId}</p><p><strong>Total: $${amount} COP</strong></p>
        <form method="post" action="${action('approved')}"><button class="ok">Aprobar pago</button></form>
        <form method="post" action="${action('rejected')}"><button class="no">Rechazar pago</button></form>
        </body>
      </html>`);
  } catch (error) {
    return next(error);
  }
});

router.post('/payments/checkout/:paymentId/:status', async (req, res, next) => {
  try {
    const { paymentId, status } = req.params;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).send('Estado inválido.');

    const paymentRef = payments.doc(paymentId);
    const paymentSnap = await paymentRef.get();
    if (!paymentSnap.exists) return res.status(404).send('Pago no encontrado.');

    const payment = paymentSnap.data();
    const paymentStatus = status === 'approved' ? 'approved' : 'rejected';
    await paymentRef.update({
      status: paymentStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (status === 'approved') {
      await trips.doc(payment.tripId).update({
        status: 'paid',
        paymentStatus: 'online',
        paymentId,
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return res.type('html').send(`<html lang="es"><body style="font-family:Arial;max-width:420px;margin:40px auto;padding:20px"><h1>Pago ${status === 'approved' ? 'aprobado' : 'rechazado'}</h1><p>Ya puedes volver a la aplicación.</p></body></html>`);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
