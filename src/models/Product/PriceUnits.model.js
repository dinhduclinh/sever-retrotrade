const mongoose = require("mongoose");

const priceUnitsSchema = new mongoose.Schema(
  {
    UnitId: { type: Number, required: true, unique: true },
    UnitName: { type: String, required: true, unique: true },
    IsDeleted: { type: Boolean, required: true, default: false },
    CreatedAt: { type: Date, required: true, default: Date.now },
    UpdatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "priceunits",
    timestamps: { createdAt: "CreatedAt", updatedAt: "UpdatedAt" },
  }
);

module.exports = mongoose.model("PriceUnits", priceUnitsSchema);
