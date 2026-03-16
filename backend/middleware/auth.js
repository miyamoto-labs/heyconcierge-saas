/**
 * API Key Authentication Middleware for HeyConcierge
 * Protects sensitive endpoints by checking x-api-key header against HC_API_KEY env var.
 * @module middleware/auth
 */

/**
 * Express middleware that requires a valid API key in the x-api-key header.
 * Returns 401 if HC_API_KEY is not configured or if the key doesn't match.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireApiKey(req, res, next) {
  const configuredKey = process.env.HC_API_KEY;

  if (!configuredKey) {
    console.error('⚠️ HC_API_KEY not configured — blocking request');
    return res.status(500).json({ error: 'Server misconfigured: API key not set' });
  }

  const providedKey = req.headers['x-api-key'];

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing API key' });
  }

  next();
}

module.exports = { requireApiKey };
