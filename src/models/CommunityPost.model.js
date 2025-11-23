const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    tags: [String],
    isActive: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 }
}, {
    timestamps: true,
    collection: 'communityPosts'
});

communityPostSchema.index({ authorId: 1, createdAt: -1 });
communityPostSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('CommunityPost', communityPostSchema);