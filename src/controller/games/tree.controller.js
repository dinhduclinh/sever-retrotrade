const mongoose = require('mongoose');
const LifeTree = require('../../models/LifeTree.model');
const User = require('../../models/User.model');
const loyaltyController = require('../loyalty/loyalty.controller');

const WATER_AMOUNT = 10;
const FERTILIZE_AMOUNT = 25;
const WATER_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const FERTILIZE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// Reward points for each stage milestone
const STAGE_REWARDS = {
  1: 100, // Stage 0 -> 1: 100 RT points
  2: 200, // Stage 1 -> 2: 200 RT points
  3: 300, // Stage 2 -> 3: 300 RT points
  4: 400, // Stage 3 -> 4: 400 RT points
  5: 500, // Stage 4 -> 5: 500 RT points
};

async function getOrCreateTree(userId) {
  let tree = await LifeTree.findOne({ userId });
  if (!tree) {
    tree = await LifeTree.create({ userId, stage: 0, growth: 0 });
  }
  return tree;
}

function applyGrowth(tree, amount) {
  let growth = tree.growth + amount;
  const oldStage = tree.stage;
  let stage = tree.stage;
  if (stage >= 5) {
    if (growth > 100) growth = 100;
  } else if (growth >= 100) {
    stage = Math.min(stage + 1, 5);
    growth = stage >= 5 ? 100 : 0;
  }
  tree.growth = growth;
  tree.stage = stage;
  tree.lastCareAt = new Date();
  return { oldStage, newStage: stage };
}

async function rewardStage(userId, tree, newStage) {
  // Check if this stage has already been rewarded
  if (!tree.rewardedStages) {
    tree.rewardedStages = [];
  }
  
  if (tree.rewardedStages.includes(newStage)) {
    return null; // Already rewarded
  }

  const points = STAGE_REWARDS[newStage];
  if (!points) {
    return null; // No reward for this stage
  }

  try {
    const result = await loyaltyController.addPoints(
      userId,
      points,
      'game_reward',
      `Đạt mốc cây trồng Stage ${newStage} - +${points} RT Points`,
      {
        metadata: { stage: newStage, gameType: 'life_tree' },
      }
    );

    if (result.success) {
      // Mark this stage as rewarded
      if (!tree.rewardedStages.includes(newStage)) {
        tree.rewardedStages.push(newStage);
        await tree.save();
      }
      return result;
    }
    return null;
  } catch (error) {
    console.error('Error rewarding stage:', error);
    return null;
  }
}

function canWater(tree, now = Date.now()) {
  // Cannot water if tree is at max level (stage 5)
  if (tree.stage >= 5) {
    return { ok: false, retryAfterMs: 0, reason: 'max_level' };
  }
  if (!tree.lastWaterAt) return { ok: true, retryAfterMs: 0 };
  const diff = now - new Date(tree.lastWaterAt).getTime();
  if (diff >= WATER_COOLDOWN_MS) return { ok: true, retryAfterMs: 0 };
  return { ok: false, retryAfterMs: WATER_COOLDOWN_MS - diff };
}

function canFertilize(tree, now = Date.now()) {
  // Cannot fertilize if tree is at max level (stage 5)
  if (tree.stage >= 5) {
    return { ok: false, retryAfterMs: 0, reason: 'max_level' };
  }
  if (!tree.lastFertilizeAt) return { ok: true, retryAfterMs: 0 };
  const diff = now - new Date(tree.lastFertilizeAt).getTime();
  if (diff >= FERTILIZE_COOLDOWN_MS) return { ok: true, retryAfterMs: 0 };
  return { ok: false, retryAfterMs: FERTILIZE_COOLDOWN_MS - diff };
}

function serializeTree(tree) {
  return {
    stage: tree.stage,
    growth: tree.growth,
    lastCareAt: tree.lastCareAt || null,
    createdAt: tree.createdAt || null,
    lastWaterAt: tree.lastWaterAt || null,
    lastFertilizeAt: tree.lastFertilizeAt || null,
  };
}

module.exports = {
  async state(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const user = await User.findById(userId).select('email points background');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const tree = await getOrCreateTree(userId);
      return res.json({ success: true, data: { user, tree: serializeTree(tree) } });
    } catch (e) {
      console.error('Tree state error:', e);
      return res.status(500).json({ success: false, message: 'Failed to fetch state', error: e.message });
    }
  },

  async water(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const tree = await getOrCreateTree(userId);
      const { ok, retryAfterMs, reason } = canWater(tree);
      if (!ok) {
        if (reason === 'max_level') {
          return res.status(400).json({ success: false, message: 'Cây đã đạt mức tối đa. Vui lòng reset để trồng cây mới.' });
        }
        return res.status(429).json({ success: false, message: 'Bạn đã tưới gần đây. Hãy thử lại sau.', retryAfterMs });
      }

      const { oldStage, newStage } = applyGrowth(tree, WATER_AMOUNT);
      tree.lastWaterAt = new Date();
      await tree.save();

      // Check if stage increased and reward points
      let rewardInfo = null;
      if (newStage > oldStage) {
        rewardInfo = await rewardStage(userId, tree, newStage);
      }

      const response = { success: true, data: serializeTree(tree) };
      if (rewardInfo && rewardInfo.success) {
        response.reward = {
          points: rewardInfo.transaction.points,
          newBalance: rewardInfo.newBalance,
          stage: newStage,
        };
      }

      return res.json(response);
    } catch (e) {
      console.error('Tree water error:', e);
      return res.status(500).json({ success: false, message: 'Failed to water', error: e.message });
    }
  },

  async fertilize(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const tree = await getOrCreateTree(userId);
      const { ok, retryAfterMs, reason } = canFertilize(tree);
      if (!ok) {
        if (reason === 'max_level') {
          return res.status(400).json({ success: false, message: 'Cây đã đạt mức tối đa. Vui lòng reset để trồng cây mới.' });
        }
        return res.status(429).json({ success: false, message: 'Bạn đã bón phân gần đây. Hãy thử lại sau.', retryAfterMs });
      }

      const { oldStage, newStage } = applyGrowth(tree, FERTILIZE_AMOUNT);
      tree.lastFertilizeAt = new Date();
      await tree.save();

      // Check if stage increased and reward points
      let rewardInfo = null;
      if (newStage > oldStage) {
        rewardInfo = await rewardStage(userId, tree, newStage);
      }

      const response = { success: true, data: serializeTree(tree) };
      if (rewardInfo && rewardInfo.success) {
        response.reward = {
          points: rewardInfo.transaction.points,
          newBalance: rewardInfo.newBalance,
          stage: newStage,
        };
      }

      return res.json(response);
    } catch (e) {
      console.error('Tree fertilize error:', e);
      return res.status(500).json({ success: false, message: 'Failed to fertilize', error: e.message });
    }
  },

  async reset(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const tree = await getOrCreateTree(userId);
      
      // Only allow reset if tree is at max level (stage 5)
      if (tree.stage < 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Chỉ có thể reset khi cây đã đạt mức tối đa (Stage 5).' 
        });
      }

      // Reset tree to initial state
      tree.stage = 0;
      tree.growth = 0;
      tree.rewardedStages = [];
      tree.lastCareAt = null;
      tree.lastWaterAt = null;
      tree.lastFertilizeAt = null;
      
      await tree.save();

      return res.json({ 
        success: true, 
        message: 'Đã reset cây thành công. Bạn có thể bắt đầu trồng cây mới!',
        data: serializeTree(tree) 
      });
    } catch (e) {
      console.error('Tree reset error:', e);
      return res.status(500).json({ success: false, message: 'Failed to reset tree', error: e.message });
    }
  },

  async updateBackground(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { background } = req.body || {};
      const allowed = ['village', 'zen', 'modern'];
      if (!allowed.includes(background)) return res.status(400).json({ success: false, message: 'Invalid background' });

      const user = await User.findByIdAndUpdate(userId, { background }, { new: true }).select('email points background');
      return res.json({ success: true, data: user });
    } catch (e) {
      console.error('Update background error:', e);
      return res.status(500).json({ success: false, message: 'Failed to update background', error: e.message });
    }
  }
};


