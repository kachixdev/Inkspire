import { google } from "googleapis";

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

const requiredOAuthEnvironment = [
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REDIRECT_URI",
];

export function getOAuthConfiguration() {
  const missingKeys = requiredOAuthEnvironment.filter(
    (key) => !process.env[key]?.trim(),
  );
  if (missingKeys.length > 0) {
    const error = new Error("Gmail OAuth is not fully configured.");
    error.code = "EMAIL_CONFIGURATION_MISSING";
    throw error;
  }

  return {
    clientId: process.env.GMAIL_CLIENT_ID.trim(),
    clientSecret: process.env.GMAIL_CLIENT_SECRET.trim(),
    redirectUri: process.env.GMAIL_REDIRECT_URI.trim(),
  };
}

export function createOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getOAuthConfiguration();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function createGmailClient(refreshToken) {
  const auth = createOAuthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth });
}
