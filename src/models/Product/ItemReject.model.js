const mongoose = require("mongoose");

const itemRejectSchema = new mongoose.Schema(
  {
    ItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true,
    },
    RejectReason: {
      type: String,
      required: true,
      maxlength: 1000,
    },
  },
  {
    collection: "itemrejects",
    timestamps: { createdAt: "CreatedAt", updatedAt: "UpdatedAt" },
  }
);


module.exports = mongoose.model("ItemReject", itemRejectSchema);
