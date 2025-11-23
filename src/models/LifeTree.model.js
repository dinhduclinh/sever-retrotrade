const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const lifeTreeSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    stage: { type: Number, min: 0, max: 5, default: 0 },
    growth: { type: Number, min: 0, max: 100, default: 0 },
    lastCareAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    // Cooldown helpers
    lastWaterAt: { type: Date },
    lastFertilizeAt: { type: Date },
    // Track rewarded stages to prevent duplicate rewards
    rewardedStages: { type: [Number], default: [] },
  },
  { timestamps: true }
);

lifeTreeSchema.index({ userId: 1 });

module.exports = mongoose.model('LifeTree', lifeTreeSchema);


