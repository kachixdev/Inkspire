# Inkspire backend

## Email delivery

Configure email variables in the Render service's Environment settings. Do not commit credentials.

The recommended hosted setup uses Resend's HTTP API:

- `RESEND_API_KEY`: API key from Resend.
- `EMAIL_FROM`: sender address on a domain verified with Resend, for example `Inkspire <no-reply@your-domain.com>`.

If `RESEND_API_KEY` is not set, the backend uses Gmail SMTP with `EMAIL_USER` and `EMAIL_PASS` (a Google App Password). Optional SMTP overrides are `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE`.

Set `FRONTEND_URL` to the deployed frontend origin so welcome and password-reset links point to the right site. See `.env.example` for the variable names.
