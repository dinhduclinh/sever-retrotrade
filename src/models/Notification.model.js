const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    notificationType: {
      type: String,
      required: true,
      maxlength: 100,
    },
    title: {
      type: String,
      required: true,
      maxlength: 300,
    },
    body: {
      type: String,
      required: true,
    },
    metaData: {
      type: String,
      maxlength: 5000,
    },
    isRead: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    collection: "notifications",
    timestamps: {
      createdAt: "CreatedAt",
      updatedAt: false,
    },
  }
);

notificationSchema.index({ user: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
