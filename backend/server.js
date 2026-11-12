require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { db } = require('./firebaseAdmin');
const tripRoutes = require('./routes/trips');
const paymentRoutes = require('./routes/payments');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (req, res) => {
  try {
    await db.collection('_health').limit(1).get();
    return res.json({ ok: true, firebase: true, service: 'uberclone-backend' });
  } catch (error) {
    return res.status(503).json({ ok: false, firebase: false, error: error.message });
  }
});

app.use('/api', tripRoutes);
app.use('/', paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', path: req.originalUrl });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 600
    ? error.statusCode
    : 500;
  return res.status(status).json({
    error: status === 500 ? 'INTERNAL_ERROR' : 'PAYMENT_REQUEST_FAILED',
    message: error.message,
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`UberClone backend escuchando en http://0.0.0.0:${port}`);
});
