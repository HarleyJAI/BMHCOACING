# Healthcare-Secure Skill

## Purpose
Enforce healthcare-grade baseline controls for every generated API endpoint.

## Mandatory Endpoint Guardrails (Non-Optional)
Never generate an API endpoint unless all three controls are present:
1. **Automated Token Validation**
   - Validate bearer tokens automatically at middleware level before business logic.
   - Reject unauthenticated/expired tokens with clear status codes.
2. **Data Encryption-at-Rest Protocols**
   - Route persistence through encrypted storage patterns (e.g., envelope encryption/KMS-managed keys).
   - Never write plaintext PHI to disk/database fields intended for protected data.
3. **Structured Audit Logging (HIPAA-aligned)**
   - Record actor, action, resource, timestamp, and outcome.
   - Log access attempts (success/failure) with immutable, structured JSON events.

## Required Endpoint Checklist
For each endpoint implementation, include and verify:
- [ ] `tokenValidationMiddleware` (or equivalent) attached.
- [ ] Encrypted persistence utility used for PHI writes.
- [ ] Structured audit log entry on request completion and security failures.

## Example Policy Snippet
```text
Endpoint blocked: missing token validation / encryption-at-rest / audit logging.
```

## Notes
- Prefer least-privilege scopes in token claims.
- Redact sensitive payload fields in logs.
- Keep retention and audit export configurable for compliance programs.
