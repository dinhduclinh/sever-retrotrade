const mongoose = require("mongoose");
const { generateString } = require("../../utils/generateString");

const discountSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: false,
            unique: true,
            index: true,
            default: () => generateString(8),
        },
        type: { type: String, enum: ["percent", "fixed"], required: true },
        value: { type: Number, required: true, min: 0 },
        maxDiscountAmount: { type: Number, default: 0, min: 0 },
        minOrderAmount: { type: Number, default: 0, min: 0 },
        startAt: { type: Date, required: true },
        endAt: { type: Date, required: true },
        usageLimit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
        usedCount: { type: Number, default: 0, min: 0 },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        isPublic: { type: Boolean, default: true, index: true },
        allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        active: { type: Boolean, default: true, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: { type: String },
    },
    { timestamps: true, collection: "discounts" }
);

discountSchema.index({ active: 1, startAt: 1, endAt: 1 });
discountSchema.index({ ownerId: 1 });
discountSchema.index({ itemId: 1 });

module.exports = mongoose.model("Discount", discountSchema);


