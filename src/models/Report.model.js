const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    reportedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    reason: String,
    description: String,
    status: {
        type: String,
        enum: ['pending', 'in_review', 'resolved', 'dismissed'],
        default: 'pending'
    },
    moderationActions: [{
        moderatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actionType: String,
        details: String,
        createdAt: { type: Date, default: Date.now }
    }],
    handledByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    handledAt: Date
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

reportSchema.index({ reporterId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);