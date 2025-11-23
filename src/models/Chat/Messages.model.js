const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    mediaType: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
    mediaUrl: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    editedAt: { type: Date },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Array of user IDs who have read this message
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
