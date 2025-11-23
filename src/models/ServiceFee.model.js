const mongoose = require("mongoose");

const serviceFeeSchema = new mongoose.Schema(
  {
    serviceFeeRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    history: [
      {
        serviceFeeRate: Number,
        description: String,
        effectiveFrom: Date,
        effectiveTo: Date,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  {
    timestamps: true,
    collection: "serviceFees",
  }
);

// Chỉ cho phép 1 serviceFee setting active tại một thời điểm
serviceFeeSchema.index({ isActive: 1 });

// Method để lấy serviceFee rate hiện tại (active)
serviceFeeSchema.statics.getCurrentServiceFeeRate = async function () {
  const serviceFee = await this.findOne({ isActive: true }).sort({ createdAt: -1 });
  return serviceFee ? serviceFee.serviceFeeRate : 3; // Default 3% nếu không có
};

// Method để lấy serviceFee setting hiện tại
serviceFeeSchema.statics.getCurrentServiceFee = async function () {
  return await this.findOne({ isActive: true }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("ServiceFee", serviceFeeSchema);

