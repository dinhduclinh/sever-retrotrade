const mongoose = require("mongoose");

const itemImagesSchema = new mongoose.Schema(
  {
    ItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Item",
    },
    Url: { type: String, required: true, maxlength: 1000 },
    IsPrimary: { type: Boolean, required: true, default: false },
    Ordinal: { type: Number, required: true, default: 0 },
    AltText: { type: String, maxlength: 500 },
    IsDeleted: { type: Boolean, required: true, default: false },
  },
  {
    collection: "itemimages",
    timestamps: { createdAt: "CreatedAt", updatedAt: "UpdatedAt" },
  }
);

module.exports = mongoose.model("ItemImages", itemImagesSchema);
