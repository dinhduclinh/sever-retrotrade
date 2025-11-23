const mongoose = require("mongoose");

const termsSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    sections: [
      {
        icon: {
          type: String,
          enum: [
            "FileText",
            "Shield",
            "Clock",
            "AlertCircle",
            "CheckCircle",
            "User",
            "Key",
            "Lock",
            "Mail",
            "Phone",
            "MapPin",
            "CreditCard",
            "DollarSign",
            "Users",
            "Globe",
            "Database",
            "Settings",
            "Info",
            "HelpCircle",
            "Zap",
            "Star",
          ], // Map với lucide icons
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        content: [
          {
            type: String,
            required: true,
          },
        ],
      },
    ],
    effectiveDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changesSummary: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Ensure only one active
termsSchema.pre("save", async function (next) {
  if (this.isActive && this.isNew) {
    await mongoose
      .model("Terms")
      .updateMany(
        { _id: { $ne: this._id }, isActive: true },
        { isActive: false }
      );
  }
  next();
});

module.exports = mongoose.model("Terms", termsSchema);
