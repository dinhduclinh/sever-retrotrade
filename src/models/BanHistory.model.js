const mongoose = require('mongoose');

const banHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        trim: true
    },
    bannedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true // true = đang bị khóa, false = đã được mở khóa
    },
    unlockedAt: {
        type: Date
    },
    unlockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    collection: "ban_histories"
});

// Indexes
banHistorySchema.index({ userId: 1, isActive: 1 });
banHistorySchema.index({ bannedBy: 1 });
banHistorySchema.index({ bannedAt: -1 });

module.exports = mongoose.model('BanHistory', banHistorySchema);

