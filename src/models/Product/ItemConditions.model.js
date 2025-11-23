const mongoose = require("mongoose");

const itemConditionsSchema = new mongoose.Schema(
  {
    ConditionId: { type: Number, required: true, unique: true },
    ConditionName: { type: String, required: true, unique: true },
    IsDeleted: { type: Boolean, required: true, default: false },
    CreatedAt: { type: Date, required: true, default: Date.now },
    UpdatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "itemconditions",
    timestamps: { createdAt: "CreatedAt", updatedAt: "UpdatedAt" },
  }
);

module.exports = mongoose.model("ItemConditions", itemConditionsSchema);
