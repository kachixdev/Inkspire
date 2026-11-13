import { randomBytes } from "node:crypto";
import { createGmailClient } from "./gmailOAuth.js";
import { getGmailRefreshToken } from "./gmailTokenStore.js";

const hasHeaderInjection = (value) => /[\r\n]/.test(value);

function validateHeader(value, fieldName) {
  if (typeof value !== "string" || !value.trim() || hasHeaderInjection(value)) {
    const error = new Error(`Invalid email ${fieldName}.`);
    error.code = "EMAIL_INVALID_MESSAGE";
    throw error;
  }
  return value.trim();
}

function validateRecipient(value) {
  const recipient = validateHeader(value, "recipient");
  if (!/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(recipient)) {
    const error = new Error("Invalid email recipient.");
    error.code = "EMAIL_INVALID_MESSAGE";
    throw error;
  }
  return recipient;
}

function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrapBase64(value) {
  return value.match(/.{1,76}/g)?.join("\r\n") || "";
}

export function createRawMessage({ to, subject, html, text, from }) {
  const sender = validateRecipient(from);
  const recipients = (Array.isArray(to) ? to : [to]).map(validateRecipient);
  if (recipients.length === 0) {
    const error = new Error("At least one email recipient is required.");
    error.code = "EMAIL_INVALID_MESSAGE";
    throw error;
  }
  const safeSubject = validateHeader(subject, "subject");
  if (typeof html !== "string" || typeof text !== "string") {
    const error = new Error("Email messages require both HTML and plain text.");
    error.code = "EMAIL_INVALID_MESSAGE";
    throw error;
  }

  const boundary = `inkspire_${randomBytes(18).toString("hex")}`;
  const parts = [
    `From: INKSPIRE <${sender}>`,
    `To: ${recipients.join(", ")}`,
    `Subject: ${encodeHeader(safeSubject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(Buffer.from(text, "utf8").toString("base64")),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(Buffer.from(html, "utf8").toString("base64")),
    `--${boundary}--`,
    "",
  ];

  return Buffer.from(parts.join("\r\n"), "utf8").toString("base64url");
}

function normalizeGoogleError(error) {
  const wrapped = new Error("Gmail API could not send the email.");
  wrapped.cause = error;

  const status = Number(error?.response?.status || error?.status || error?.code);
  const providerError = error?.response?.data?.error;
  if (
    status === 401 ||
    status === 403 ||
    error?.code === "invalid_grant" ||
    providerError === "invalid_grant"
  ) {
    wrapped.code = "EMAIL_AUTH_FAILED";
  } else if (
    ["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ENOTFOUND"].includes(
      error?.code,
    )
  ) {
    wrapped.code = "EMAIL_CONNECTION_FAILED";
  } else {
    wrapped.code = "EMAIL_PROVIDER_REJECTED";
  }
  if (Number.isInteger(status)) {
    wrapped.statusCode = status;
  }
  return wrapped;
}

export async function sendEmail({ to, subject, html, text }) {
  const sender = process.env.GMAIL_USER?.trim();
  if (!sender) {
    const error = new Error("Gmail sender is not configured.");
    error.code = "EMAIL_CONFIGURATION_MISSING";
    throw error;
  }

  const refreshToken = await getGmailRefreshToken();
  const raw = createRawMessage({ to, subject, html, text, from: sender });

  try {
    const gmail = createGmailClient(refreshToken);
    return await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });
  } catch (error) {
    throw normalizeGoogleError(error);
  }
}
