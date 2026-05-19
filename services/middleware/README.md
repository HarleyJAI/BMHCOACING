# Middleware Relay Scaffold (Node.js)

Sketch service for a secure relay between a mobile diagnostics platform and a FHIR-compliant EHR.

## Security controls included
- **Token validation enforced on every endpoint** via global `tokenValidation` middleware.
- **Encryption-at-rest hooks** via `encryptForStorage` (placeholder for KMS/HSM-backed encryption).
- **HIPAA-style structured audit logs** emitted on every response (`type=hipaa_audit`, actor, endpoint, outcome, status code).

## Quick start
```bash
cd services/middleware
npm install
ALLOWED_TOKENS="demo-token" ENCRYPTION_KEY="replace-me" npm start
```

Then call:
```bash
curl -X POST http://localhost:8080/api/v1/relay/fhir \
  -H "Authorization: Bearer demo-token" \
  -H "Content-Type: application/json" \
  -d '{"resourceType":"Observation","id":"obs-123","status":"final"}'
```

## Notes
- This is a **scaffold**, not production-ready.
- Replace token checks with OAuth2/JWT verification and/or introspection.
- Replace local encryption key usage with enterprise key management and immutable audit sinks.
