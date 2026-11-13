import mongoose from "mongoose";

const gmailCredentialSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "primary",
    },
    encryptedRefreshToken: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
);

const GmailCredential =
  mongoose.models.GmailCredential ||
  mongoose.model("GmailCredential", gmailCredentialSchema);

export default GmailCredential;
