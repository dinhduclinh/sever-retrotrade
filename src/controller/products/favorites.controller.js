const mongoose = require("mongoose");
const Favorite = require("../../models/Product/Favorites.model");
const Item = require("../../models/Product/Item.model");

const addToFavorites = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { productId } = req.params;
    const userId = req.user._id.toString();
    if (!productId || !userId) {
      return res
        .status(400)
        .json({ message: "Thiếu ID sản phẩm hoặc người dùng" });
    }
    let itemId, userObjectId;
    try {
      itemId = new mongoose.Types.ObjectId(productId);
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (castError) {
      return res
        .status(400)
        .json({ message: "ID sản phẩm hoặc người dùng không hợp lệ" });
    }
    const item = await Item.findById(itemId).select("Title FavoriteCount");
    if (!item) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    const existingFavorite = await Favorite.findOne({
      userId: userObjectId,
      productId: itemId,
    }).select("_id");
    if (existingFavorite) {
      return res.status(400).json({ message: "Sản phẩm đã được yêu thích" });
    }
    const newFavorite = new Favorite({
      userId: userObjectId,
      productId: itemId,
    });
    await newFavorite.save();
    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      { $inc: { FavoriteCount: 1 } },
      { new: true, runValidators: true }
    ).select("FavoriteCount");

    if (updatedItem && updatedItem.FavoriteCount < 0) {
      await Item.findByIdAndUpdate(itemId, { FavoriteCount: 0 });
    }
    res.status(201).json({
      message: "Thêm vào yêu thích thành công",
      data: newFavorite,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server khi thêm yêu thích", error: error.message });
  }
};

const removeFromFavorites = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { productId } = req.params;
    const userId = req.user._id.toString();
    if (!productId || !userId) {
      return res
        .status(400)
        .json({ message: "Thiếu ID sản phẩm hoặc người dùng" });
    }
    let itemId, userObjectId;
    try {
      itemId = new mongoose.Types.ObjectId(productId);
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (castError) {
      return res
        .status(400)
        .json({ message: "ID sản phẩm hoặc người dùng không hợp lệ" });
    }
    const deletedFavorite = await Favorite.findOneAndDelete({
      userId: userObjectId,
      productId: itemId,
    }).select("_id");
    if (!deletedFavorite) {
      return res.status(404).json({ message: "Sản phẩm chưa được yêu thích" });
    }
    let updatedItem = await Item.findByIdAndUpdate(
      itemId,
      { $inc: { FavoriteCount: -1 } },
      { new: true, runValidators: true }
    ).select("FavoriteCount");
    if (updatedItem && updatedItem.FavoriteCount < 0) {
      updatedItem = await Item.findByIdAndUpdate(
        itemId,
        { FavoriteCount: 0 },
        { new: true }
      ).select("FavoriteCount");
    }
    res.json({
      message: "Xóa khỏi yêu thích thành công",
      data: deletedFavorite,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server khi xóa yêu thích", error: error.message });
  }
};
const getFavorites = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user._id.toString();
    if (!userId) {
      return res.status(400).json({ message: "Thiếu ID người dùng" });
    }
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (castError) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }
    const favorites = await Favorite.find({ userId: userObjectId })
      .populate("productId", "Title BasePrice Images FavoriteCount")
      .sort({ createdAt: -1 });
    res.json({
      message: "Danh sách yêu thích",
      data: favorites,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách yêu thích",
      error: error.message,
    });
  }
};
module.exports = {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
};
