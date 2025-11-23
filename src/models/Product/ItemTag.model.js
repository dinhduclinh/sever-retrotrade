const mongoose = require("mongoose");

const itemTagSchema = new mongoose.Schema(
  {
    ItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Item",
    },
    TagId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Tag",
    },
    IsDeleted: { type: Boolean, required: true, default: false },
  },
  {
    collection: "itemtags",
    timestamps: { createdAt: "CreatedAt", updatedAt: "UpdatedAt" },
  }
);

itemTagSchema.index({ ItemId: 1, TagId: 1 }, { unique: true });

module.exports = mongoose.model("ItemTag", itemTagSchema);
