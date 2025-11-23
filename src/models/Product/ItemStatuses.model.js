const mongoose = require("mongoose");

const itemStatusesSchema = new mongoose.Schema(
  {
    StatusId: { type: Number, required: true, unique: true },
    StatusName: { type: String, required: true, unique: true },
    IsDeleted: { type: Boolean, required: true, default: false },
    CreatedAt: { type: Date, required: true, default: Date.now },
    UpdatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "itemstatuses",
    timestamps: { createdAt: "CreatedAt", updatedAt: "UpdatedAt" },
  }
);

module.exports = mongoose.model("ItemStatuses", itemStatusesSchema);
