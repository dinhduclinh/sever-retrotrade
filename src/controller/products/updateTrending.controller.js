const Item = require("../../models/Product/Item.model"); 
const Order = require("../../models/Order/Order.model");
const Favorites = require("../../models/Product/Favorites.model"); 

const updateTrendingItems = async () => {
  try {
    const items = await Item.find({ StatusId: 2, IsDeleted: false }); 
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); 

    const updates = [];
    for (const item of items) {
      
      const recentRents = await Order.countDocuments({
        itemId: item._id,
        orderStatus: "completed", 
        endAt: { $gt: threeMonthsAgo },
      });

      const recentFavorites = await Favorites.countDocuments({
        ItemId: item._id, 
        CreatedAt: { $gt: threeMonthsAgo },
      });

      
      const recentViews = item.ViewCount; 

      const score =
        recentViews * 0.1 + recentFavorites * 0.3 + recentRents * 0.6;
      const threshold = 100; 
      const newTrending = score > threshold;


      updates.push({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { IsTrending: newTrending } },
        },
      });
    }

    if (updates.length > 0) {
      await Item.bulkWrite(updates); 
    }

    console.log("Sản phẩm được cập nhật trending thành công");
  } catch (error) {
    console.error("Lỗi cập nhật trending sản phẩm:", error);
  }
};

module.exports = {
  updateTrendingItems,
};
