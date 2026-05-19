## Summary
- What changed?
- Why now?

## Branch Protection Readiness Checklist (Required)
- [ ] CI workflow passed (`Feature Branch Security and Review`)
- [ ] Security scan artifact reviewed (`bandit-report.json`)
- [ ] Test output reviewed (`pytest-output.txt`)
- [ ] Automated review report reviewed (`review-report.md`)
- [ ] At least one human reviewer assigned

## Healthcare-Secure API Checklist (Required for endpoint changes)
- [ ] Automated token validation is enforced for each endpoint
- [ ] Encryption-at-rest path is used for PHI persistence
- [ ] Structured HIPAA-aligned audit logging is emitted for success/failure

## Validation
```bash
# paste exact commands and results
```

## Risk / Rollback
- Primary risks:
- Rollback plan:
