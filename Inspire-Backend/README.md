# Inkspire backend

## Gmail API email delivery

Inkspire sends account and comment emails through the Gmail API over HTTPS. SMTP, Nodemailer, and paid email providers are not used. Email sending is server-side; never put these credentials in Vercel frontend variables or source control.

### Render environment variables

Set these in the Render backend service:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GMAIL_CLIENT_ID` | Yes | Google OAuth web application client ID |
| `GMAIL_CLIENT_SECRET` | Yes | Google OAuth web application client secret |
| `GMAIL_REDIRECT_URI` | Yes | Exact callback URL registered in Google Cloud |
| `GMAIL_USER` | Yes | Gmail mailbox authorized to send Inkspire email |
| `GMAIL_TOKEN_ENCRYPTION_KEY` | Yes for admin OAuth setup | Base64-encoded 32-byte key used to encrypt the refresh token in MongoDB |
| `GMAIL_REFRESH_TOKEN` | Optional fallback | Existing refresh token used only when there is no encrypted MongoDB token |
| `FRONTEND_URL` | Recommended | `https://inkspireblog.vercel.app` |

Use this production callback URL for both `GMAIL_REDIRECT_URI` and the Google Cloud authorized redirect URI:

```text
https://inkspireblog.vercel.app/api/admin/gmail/oauth/callback
```

The Vercel `/api/*` rewrite forwards that callback to Render while keeping the admin's browser session available. For local development, set `GMAIL_REDIRECT_URI` to the corresponding local backend callback and add that exact URI to the OAuth client.

Generate a new encryption key locally and set its output as `GMAIL_TOKEN_ENCRYPTION_KEY` in Render:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Keep the key stable and private. Losing it makes the MongoDB-stored refresh token unreadable; rotating it requires reconnecting Gmail (or re-encrypting the stored token). MongoDB stores only the encrypted token. The optional `GMAIL_REFRESH_TOKEN` environment variable is used only if no encrypted token exists; it is plaintext in Render's secret settings, so prefer the encrypted OAuth flow.

`GMAIL_USER` must be the same mailbox that grants consent. `REDIS_URL`, `MONGODB_URI`, and the application's existing auth variables must also be configured as before.

### Google Cloud setup and authorization

1. Create or select a Google Cloud project, enable the **Gmail API**, and configure the OAuth consent screen.
2. Create an OAuth client ID of type **Web application**. Add the exact production callback above as an authorized redirect URI.
3. Configure the Gmail sending scope `https://www.googleapis.com/auth/gmail.send`. The OAuth flow requests offline access and consent so Google can return a refresh token.
4. If the consent screen is in **Testing**, add the Gmail account that will send email as a test user. Google refresh tokens for external apps in Testing can expire after seven days; reconnect when that happens or complete Google's production verification.
5. Add the variables to Render, deploy the backend, sign in to Inkspire as an admin, open the Admin workspace, and choose **Connect Gmail**. Complete Google's consent flow in the same browser, selecting the account matching `GMAIL_USER`. The admin page shows whether an authorization token is saved; it cannot detect later revocation until an email is sent.

The admin OAuth start and callback routes require the admin session, validate a random, single-use state stored in Redis, and request only `gmail.send`. Tokens are never returned to the frontend or logged. The callback encrypts the refresh token before storing it in MongoDB. Google automatically refreshes access tokens while sending.

Gmail's send permission is a restricted Google scope. Google may require app verification and domain verification before allowing general production use. A `vercel.app` hostname may not satisfy Google's authorized-domain verification requirements; if Google blocks production authorization, a domain you can verify and Google's review process may be necessary. A custom domain is not required for trying the flow with an allowed test user, but Google controls the consent and verification requirements.

### Existing email integrations

- Signup sends a branded welcome email. Account creation still succeeds when delivery is unavailable, and the response reports the delivery status.
- Forgot password sends a branded, expiring reset link. An email delivery failure is reported without exposing provider credentials.
- Password changes and password resets send a security notice.
- A comment on another author's story sends that author a branded comment notification. The comment itself is retained even if notification delivery fails.

Email verification, OTP, newsletter, contact-form, and threaded reply flows are not present in the application and were not added.

