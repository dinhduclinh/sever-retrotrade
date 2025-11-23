const mongoose = require("mongoose");

const PostCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports =  mongoose.models.PostCategory ||
  mongoose.model("PostCategory", PostCategorySchema);
