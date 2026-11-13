import { createDecipheriv, createCipheriv, randomBytes } from "node:crypto";
import GmailCredential from "../Models/GmailCredential.js";

function getEncryptionKey() {
  const encodedKey = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!encodedKey) {
    const error = new Error("Gmail refresh-token encryption is not configured.");
    error.code = "EMAIL_CONFIGURATION_MISSING";
    throw error;
  }

  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32) {
    const error = new Error("Gmail refresh-token encryption key is invalid.");
    error.code = "EMAIL_CONFIGURATION_INVALID";
    throw error;
  }
  return key;
}

export function assertTokenEncryptionConfigured() {
  getEncryptionKey();
}

export function encryptRefreshToken(refreshToken) {
  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    const error = new Error("A Gmail refresh token is required.");
    error.code = "EMAIL_TOKEN_INVALID";
    throw error;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(refreshToken, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptRefreshToken(encryptedToken) {
  try {
    const [version, encodedIv, encodedTag, encodedCiphertext, ...extra] =
      encryptedToken.split(".");
    if (
      version !== "v1" ||
      !encodedIv ||
      !encodedTag ||
      !encodedCiphertext ||
      extra.length > 0
    ) {
      throw new Error("Invalid encrypted token format.");
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(encodedIv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (cause) {
    const error = new Error("The stored Gmail refresh token could not be decrypted.");
    error.code = "EMAIL_TOKEN_STORAGE_FAILED";
    error.cause = cause;
    throw error;
  }
}

export async function saveGmailRefreshToken(refreshToken) {
  const encryptedRefreshToken = encryptRefreshToken(refreshToken);
  await GmailCredential.findOneAndUpdate(
    { key: "primary" },
    { $set: { encryptedRefreshToken } },
    { upsert: true, new: true, runValidators: true },
  );
}

export async function getGmailRefreshToken() {
  const credential = await GmailCredential.findOne({ key: "primary" })
    .select("+encryptedRefreshToken")
    .lean();
  if (credential?.encryptedRefreshToken) {
    return decryptRefreshToken(credential.encryptedRefreshToken);
  }

  const environmentToken = process.env.GMAIL_REFRESH_TOKEN?.trim();
  if (environmentToken) {
    return environmentToken;
  }

  const error = new Error("No Gmail refresh token has been authorized.");
  error.code = "EMAIL_CONFIGURATION_MISSING";
  throw error;
}

export async function hasGmailRefreshToken() {
  if (await GmailCredential.exists({ key: "primary" })) {
    return true;
  }
  return Boolean(process.env.GMAIL_REFRESH_TOKEN?.trim());
}
