const mongoose = require("mongoose");

const itemAddressSchema = new mongoose.Schema(
  {
    UserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, 
    },
    Address: {
      type: String,
      maxlength: 500,
      required: true,
    },
    City: {
      type: String,
      maxlength: 200,
      required: true,
    },
    District: {
      type: String,
      maxlength: 200,
      required: true,
    },
    IsDefault: {
      type: Boolean,
      default: false, 
    },
  },
  {
    collection: "itemaddresses",
    timestamps: { createdAt: "CreatedAt", updatedAt: "UpdatedAt" },
  }
);

itemAddressSchema.index(
  { UserId: 1, Address: 1, City: 1, District: 1 },
  { unique: true }
);

module.exports = mongoose.model("ItemAddress", itemAddressSchema);
