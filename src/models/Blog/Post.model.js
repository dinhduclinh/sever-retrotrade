const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  shortDescription: String,
  content: { type: String, required: true },
  thumbnail: String,
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "PostCategory" },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports =  mongoose.models.Post || mongoose.model("Post", PostSchema);
