const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    description: String,
    parentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Categories' },
    path: [String],
    level: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});
categorySchema.index({ parentCategoryId: 1 });

module.exports = mongoose.model('Categories', categorySchema);