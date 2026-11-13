import { Router } from "express";
import authorize from "../middleWares/authorize.js";
import {
  finishGmailOAuth,
  getGmailStatus,
  startGmailOAuth,
} from "../Controllers/gmailOAuthController.js";

const router = Router();
const adminOnly = authorize(["admin"]);

router.get("/status", adminOnly, getGmailStatus);
router.get("/oauth/start", adminOnly, startGmailOAuth);
router.get("/oauth/callback", adminOnly, finishGmailOAuth);

export default router;
