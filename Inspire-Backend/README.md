# Inkspire backend

## Email delivery

Configure email variables in the Render service's Environment settings. Do not commit credentials.

### Gmail SMTP (no OAuth)

Gmail SMTP uses an App Password, not OAuth. Render Free blocks outbound SMTP ports `25`, `465`, and `587`, so this setup requires a hosting plan/provider that permits SMTP.

- Enable 2-Step Verification on the Gmail account, then create a Google App Password.
- Set `EMAIL_USER` to that Gmail address and `EMAIL_PASS` to its App Password in the hosting environment. Do not use the normal Gmail password.
- The backend connects to `smtp.gmail.com` on port `465` with TLS and uses `Inkspire` as the sender display name.

Signup welcome messages and password-reset links both use the same Gmail SMTP mailer. Delivery fails with a configuration error if Gmail credentials are missing.

Set `FRONTEND_URL` to the deployed frontend origin so welcome and password-reset links point to the right site. See `.env.example` for the variable names.
