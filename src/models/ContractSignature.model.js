const mongoose = require("mongoose");

const ContractSignatureSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contracts", 
      required: true,
      index: true,
    },
    signatureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSignature",
      required: true,
    },
    signedAt: {
      type: Date,
      default: Date.now,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    verificationInfo: {
      type: String,
      maxlength: 500,
    },
    positionX: {
      type: Number,
      default: 0,
    },
    positionY: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("ContractSignature", ContractSignatureSchema);
