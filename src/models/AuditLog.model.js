const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    TableName: { type: String, required: true },
    PrimaryKeyValue: { type: String, required: true },
    Operation: {
      type: String,
      required: true,
      enum: ["INSERT", "UPDATE", "DELETE"],
    },
    ChangedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ChangedAt: { type: Date, default: Date.now },
    ChangeSummary: { type: String },
  },
  {
    collection: "auditlogs",
    timestamps: false, 
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
