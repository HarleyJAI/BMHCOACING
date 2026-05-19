const crypto = require('crypto');

function createAuditEvent(req, res) {
  return {
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action: req.method,
    endpoint: req.originalUrl,
    actor: req.auth?.tokenId || 'unknown',
    sourceIp: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
    statusCode: res.statusCode,
    requestId: req.get('x-request-id') || null,
    outcome: res.statusCode < 400 ? 'success' : 'failure'
  };
}

function auditLogger(req, res, next) {
  res.on('finish', () => {
    const auditEvent = createAuditEvent(req, res);

    // Sketch sink: replace with immutable audit store / SIEM pipeline.
    process.stdout.write(`${JSON.stringify({ type: 'hipaa_audit', ...auditEvent })}\n`);
  });

  next();
}

module.exports = { auditLogger };
