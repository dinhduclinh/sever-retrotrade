const mongoose = require("mongoose");

const UserSignatureSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    signatureData: {
      type: Buffer,
      required: true,
    },
    iv: {
      type: String, 
      required: true,
    },
    signatureImagePath: {
      type: String, 
      required: true,
    },
    issuedBy: {
      type: String,
      default: "System",
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validTo: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserSignature", UserSignatureSchema);
