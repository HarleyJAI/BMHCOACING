const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { tokenValidation } = require('./middleware/tokenValidation');
const { auditLogger } = require('./middleware/auditLogger');
const { fhirRelayRouter } = require('./routes/fhirRelay');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(morgan('combined'));

// Enforce auth and audit logging across all endpoints.
app.use(tokenValidation);
app.use(auditLogger);

app.use('/api/v1', fhirRelayRouter);

app.use((err, _req, res, _next) => {
  process.stderr.write(`middleware_error ${err.message}\n`);
  res.status(500).json({ error: 'Unexpected middleware relay error.' });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  process.stdout.write(`middleware relay listening on :${port}\n`);
});
