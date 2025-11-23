const mongoose = require("mongoose");

const ContractsSchema = new mongoose.Schema(
  {
    rentalOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    renterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContractTemplate", 
    },
    contractContent: {
      type: String,
      required: true, 
    },
    contractFilePath: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Draft", "PendingSignature", "Signed", "Completed", "Cancelled"],
      default: "Draft", 
    },
    signatureDate: {
      type: Date,
    },
    signatures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ContractSignature",
      },
    ],
  },
  {
    timestamps: true, 
  }
);

ContractsSchema.index({ rentalOrderId: 1 });
ContractsSchema.index({ status: 1 });

module.exports = mongoose.model("Contracts", ContractsSchema);
