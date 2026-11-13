import client from "../config/redis.js";
import {
  createOAuthClient,
  GMAIL_SEND_SCOPE,
} from "../utils/gmailOAuth.js";
import {
  createGmailOAuthState,
  consumeGmailOAuthState,
} from "../utils/gmailOAuthState.js";
import {
  assertTokenEncryptionConfigured,
  getGmailRefreshToken,
  hasGmailRefreshToken,
  saveGmailRefreshToken,
} from "../utils/gmailTokenStore.js";

const getAdminRedirect = (result) => {
  const frontendUrl = (
    process.env.FRONTEND_URL || "https://inkspireblog.vercel.app"
  )
    .split(",")[0]
    .trim();
  const redirect = new URL("/admin", frontendUrl);
  redirect.searchParams.set("gmail", result);
  return redirect.toString();
};

const logOAuthFailure = (label, error) => {
  console.error(label, {
    code: error?.code || "GMAIL_OAUTH_FAILED",
    status: error?.response?.status || error?.status || undefined,
  });
};

export const getGmailStatus = async (_req, res) => {
  try {
    const requiredKeys = [
      "GMAIL_CLIENT_ID",
      "GMAIL_CLIENT_SECRET",
      "GMAIL_REDIRECT_URI",
      "GMAIL_USER",
    ];
    const configured = requiredKeys.every((key) => process.env[key]?.trim());
    let connected = false;
    if (configured) {
      try {
        await getGmailRefreshToken();
        connected = true;
      } catch (error) {
        if (error?.code !== "EMAIL_CONFIGURATION_MISSING") {
          throw error;
        }
      }
    }
    return res.status(200).json({ configured, connected });
  } catch (error) {
    logOAuthFailure("Gmail status check failed:", error);
    return res.status(503).json({ message: "Gmail status is unavailable." });
  }
};

export const startGmailOAuth = async (req, res) => {
  try {
    if (!process.env.GMAIL_USER?.trim()) {
      const error = new Error("Gmail sender is not configured.");
      error.code = "EMAIL_CONFIGURATION_MISSING";
      throw error;
    }
    assertTokenEncryptionConfigured();
    const state = await createGmailOAuthState(req.user.id, client);
    const authorizationUrl = createOAuthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [GMAIL_SEND_SCOPE],
      state,
    });
    return res.redirect(authorizationUrl);
  } catch (error) {
    logOAuthFailure("Could not start Gmail authorization:", error);
    return res.status(503).json({
      message: "Gmail authorization is unavailable. Check the server configuration.",
    });
  }
};

export const finishGmailOAuth = async (req, res) => {
  try {
    const validState = await consumeGmailOAuthState(
      req.query.state,
      req.user.id,
      client,
    );
    if (!validState) {
      return res.status(400).send("Gmail authorization could not be verified. Start again from the admin page.");
    }

    if (req.query.error) {
      return res.redirect(getAdminRedirect("error"));
    }
    if (typeof req.query.code !== "string" || !req.query.code) {
      return res.status(400).send("Gmail authorization did not return a code. Start again from the admin page.");
    }

    const { tokens } = await createOAuthClient().getToken(req.query.code);
    if (tokens.refresh_token) {
      await saveGmailRefreshToken(tokens.refresh_token);
    } else if (!(await hasGmailRefreshToken())) {
      return res.redirect(getAdminRedirect("error"));
    }

    return res.redirect(getAdminRedirect("connected"));
  } catch (error) {
    logOAuthFailure("Gmail authorization callback failed:", error);
    return res.redirect(getAdminRedirect("error"));
  }
};
