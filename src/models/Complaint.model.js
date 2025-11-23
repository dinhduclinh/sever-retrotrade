const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false 
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        default: "Khiếu nại về tài khoản bị ban"
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'resolved', 'rejected'],
        default: 'pending'
    },
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    handledAt: Date,
    adminResponse: String
}, {
    timestamps: true,
    collection: "complaints"
});

complaintSchema.index({ email: 1, createdAt: -1 });
complaintSchema.index({ status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);

