# Inkspire backend

## Email delivery

Configure email variables in the Render service's Environment settings. Do not commit credentials.

### Resend (recommended for Render Free)

Render Free blocks outbound SMTP ports `25`, `465`, and `587`. Resend sends over HTTPS, so it works without Gmail OAuth or SMTP credentials:

- Create a Resend account, verify a domain you control, and create an API key.
- Set `RESEND_API_KEY` in the Render service's Environment settings.
- Set `EMAIL_FROM` to a sender address on that verified domain, such as `Inkspire <hello@your-domain.com>`.

Signup welcome messages and password-reset links both use the Resend API. Delivery fails with a configuration error if the API key or sender is missing; a valid API key and verified sending domain are required for delivery to users.

Set `FRONTEND_URL` to the deployed frontend origin so welcome and password-reset links point to the right site. See `.env.example` for the variable names.
