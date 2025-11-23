const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    userId1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userId2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    lastReadBy: {
        userId1: { type: Date }, // Last read timestamp for userId1
        userId2: { type: Date }  // Last read timestamp for userId2
    }
});

conversationSchema.index(
    { userId1: 1, userId2: 1 },
    { unique: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
