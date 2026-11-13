import { randomBytes } from "node:crypto";

const STATE_TTL_SECONDS = 10 * 60;
const STATE_PREFIX = "gmail-oauth-state:";

export async function createGmailOAuthState(adminId, redisClient) {
  const state = randomBytes(32).toString("base64url");
  const saved = await redisClient.set(
    `${STATE_PREFIX}${state}`,
    String(adminId),
    { EX: STATE_TTL_SECONDS, NX: true },
  );
  if (saved !== "OK") {
    const error = new Error("Could not start Gmail authorization.");
    error.code = "EMAIL_OAUTH_STATE_FAILED";
    throw error;
  }
  return state;
}

export async function consumeGmailOAuthState(state, adminId, redisClient) {
  if (typeof state !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(state)) {
    return false;
  }
  const stateOwner = await redisClient.getDel(`${STATE_PREFIX}${state}`);
  return stateOwner === String(adminId);
}
