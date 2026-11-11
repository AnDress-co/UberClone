const { auth } = require('../firebaseAdmin');

async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Se requiere un token Bearer.' });
  }

  try {
    req.user = await auth.verifyIdToken(match[1]);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'El token no es válido o expiró.' });
  }
}

function requireSimulatorKey(req, res, next) {
  const expectedKey = process.env.SIMULATOR_KEY;
  if (!expectedKey) return next();

  if (req.get('x-simulator-key') !== expectedKey) {
    return res.status(401).json({ error: 'INVALID_SIMULATOR_KEY' });
  }

  return next();
}

module.exports = { requireAuth, requireSimulatorKey };
