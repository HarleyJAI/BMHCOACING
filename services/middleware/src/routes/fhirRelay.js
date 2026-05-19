const express = require('express');
const { encryptForStorage } = require('../security/encryptionHooks');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'middleware-relay' });
});

router.post('/relay/fhir', express.json({ limit: '1mb' }), (req, res) => {
  const { resourceType, id } = req.body || {};

  if (!resourceType) {
    return res.status(400).json({ error: 'FHIR resourceType is required.' });
  }

  const encryptedRecord = encryptForStorage({
    metadata: { resourceType, id: id || null },
    rawPayload: req.body
  });

  // Sketch response: in production, forward to EHR and persist encrypted copy.
  return res.status(202).json({
    message: 'FHIR payload accepted for secure relay.',
    storageEnvelope: {
      algorithm: encryptedRecord.algorithm,
      keyRef: encryptedRecord.keyRef,
      createdAt: encryptedRecord.createdAt
    }
  });
});

module.exports = { fhirRelayRouter: router };
