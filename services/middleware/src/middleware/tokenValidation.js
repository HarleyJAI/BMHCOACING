function tokenValidation(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid bearer token.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Bearer token is empty.' });
  }

  // Sketch validation logic: replace with OAuth2/JWT introspection.
  const approvedTokens = (process.env.ALLOWED_TOKENS || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (approvedTokens.length === 0 || !approvedTokens.includes(token)) {
    return res.status(403).json({ error: 'Token is not authorized for this relay.' });
  }

  req.auth = { tokenId: token.slice(0, 8), validatedAt: new Date().toISOString() };
  return next();
}

module.exports = { tokenValidation };
