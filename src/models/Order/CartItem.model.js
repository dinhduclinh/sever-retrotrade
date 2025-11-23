const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    rentalStartDate: Date,
    rentalEndDate: Date,
    quantity: { type: Number, default: 1 }
}, {
    timestamps: true,
    collection: 'cartItems'
});

cartItemSchema.index({ userId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', cartItemSchema);
