const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const itemSchema = new mongoose.Schema(
  {
    ItemGuid: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    OwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    Title: { type: String, required: true, maxlength: 300 },
    ShortDescription: { type: String, maxlength: 1000 },
    Description: { type: String },
    CategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Categories" },
    ConditionId: { type: Number, required: true },
    BasePrice: { type: Number, required: true, min: 0.01 },
    PriceUnitId: { type: Number, required: true },
    DepositAmount: { type: Number, required: true, min: 0.01 },
    MinRentalDuration: { type: Number, min: 1 },
    MaxRentalDuration: { type: Number, min: 1 },
    Currency: {
      type: String,
      required: true,
      enum: ["VND", "USD"],
      default: "VND",
    },
    Quantity: { type: Number, required: true, min: 1 },
    AvailableQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: function () {
        return this.Quantity;
      },
    },
    StatusId: {
      type: Number,
      required: true,
      enum: [1, 2, 3], 
      default: 1,
    },
    Address: { type: String, maxlength: 500 },
    City: { type: String, maxlength: 200 },
    District: { type: String, maxlength: 200 },
    IsHighlighted: { type: Boolean, required: true, default: false },
    IsTrending: { type: Boolean, required: true, default: false },
    ViewCount: { type: Number, required: true, default: 0 },
    FavoriteCount: { type: Number, required: true, default: 0 },
    RentCount: { type: Number, required: true, default: 0 },
    IsDeleted: { type: Boolean, required: true, default: false },
  },
  {
    collection: "items",
    timestamps: { createdAt: "CreatedAt", updatedAt: "UpdatedAt" },
  }
);

// Indexes cho performance
itemSchema.index({ OwnerId: 1 });
itemSchema.index({ CategoryId: 1 });
itemSchema.index({ StatusId: 1 });
itemSchema.index({ IsDeleted: 1 });
itemSchema.index({ createdAt: -1, updatedAt: -1 });

module.exports = mongoose.model("Item", itemSchema);
