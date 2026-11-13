# Inkspire backend

## Email delivery

Configure email variables in the Render service's Environment settings. Do not commit credentials.

### Gmail API (recommended for Render Free)

Render Free blocks outbound SMTP ports `25`, `465`, and `587`, so Gmail SMTP cannot send from a Free web service. Use the Gmail API over HTTPS instead:

- Enable the Gmail API in a Google Cloud project and configure OAuth consent.
- Create OAuth credentials and generate an offline refresh token with the `https://www.googleapis.com/auth/gmail.send` scope. If the OAuth consent screen remains in testing mode, Google can expire refresh tokens after seven days.
- Set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` in Render.
- Set `EMAIL_USER` to the Gmail account authorized by those credentials. Gmail API messages use this account as the sender.

When all Gmail API settings are present, the backend uses the Gmail API before any other configured provider. Gmail API messages use `EMAIL_USER` as the sender; `EMAIL_FROM` is ignored for this provider.

### Other providers

- Resend can be used by setting `RESEND_API_KEY` and `EMAIL_FROM` to a sender address on a domain verified with Resend.
- If neither Gmail API OAuth nor Resend is configured, the backend uses Gmail SMTP with `EMAIL_USER` and `EMAIL_PASS` (a Google App Password). Optional SMTP overrides are `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE`. Render Free blocks this SMTP fallback.

Set `FRONTEND_URL` to the deployed frontend origin so welcome and password-reset links point to the right site. See `.env.example` for the variable names.
