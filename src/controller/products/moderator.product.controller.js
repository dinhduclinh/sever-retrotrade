const Item = require("../../models/Product/Item.model");
const ItemImage = require("../../models/Product/ItemImage.model");
const ItemReject = require("../../models/Product/ItemReject.model");
const User = require("../../models/User.model");
const Category = require("../../models/Product/Categories.model");
const ItemConditions = require("../../models/Product/ItemConditions.model");
const PriceUnits = require("../../models/Product/PriceUnits.model");
const Notification = require("../../models/Notification.model");
const AuditLog = require("../../models/AuditLog.model");
const { sendEmail } = require("../../utils/sendEmail");
const mongoose = require("mongoose");

const logAudit = async (
  tableName,
  primaryKeyValue,
  operation,
  changedByUserId,
  changeSummary
) => {
  await AuditLog.create({
    TableName: tableName,
    PrimaryKeyValue: primaryKeyValue.toString(),
    Operation: operation,
    ChangedByUserId: changedByUserId,
    ChangedAt: new Date(),
    ChangeSummary: changeSummary,
  });
};

const getPendingProducts = async (req, res) => {
  try {
    const query = {
      StatusId: 1, // Pending
      IsDeleted: false,
    };

    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "OwnerId",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            { $project: { fullName: 1, avatarUrl: 1, reputationScore: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "CategoryId",
          foreignField: "_id",
          as: "category",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $lookup: {
          from: "itemconditions",
          localField: "ConditionId",
          foreignField: "ConditionId",
          as: "condition",
          pipeline: [
            { $match: { IsDeleted: false } },
            { $project: { ConditionName: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "priceunits",
          localField: "PriceUnitId",
          foreignField: "UnitId",
          as: "priceUnit",
          pipeline: [
            { $match: { IsDeleted: false } },
            { $project: { UnitName: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "itemimages",
          localField: "_id",
          foreignField: "ItemId",
          as: "images",
          pipeline: [
            { $match: { IsDeleted: false } },
            { $sort: { Ordinal: 1 } },
            { $limit: 1 }, 
          ],
        },
      },
      { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$condition", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$priceUnit", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$images", preserveNullAndEmptyArrays: true } },
      { $sort: { CreatedAt: -1 } },
      {
        $project: {
          _id: { $toString: "$_id" },
          ItemGuid: 1,
          Title: 1,
          ownerName: "$owner.fullName",
          categoryName: "$category.name",
          conditionName: "$condition.ConditionName",
          priceUnitName: "$priceUnit.UnitName",
          thumbnailUrl: { $ifNull: ["$images.Url", null] }, 
          createdAt: {
            $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$CreatedAt" },
          },
          viewCount: "$ViewCount",
          basePrice: "$BasePrice",
          currency: "$Currency",
        },
      },
    ];

    const products = await Item.aggregate(pipeline);

    res.json({
      data: products,
    });
  } catch (error) {
    console.error("Error in getPendingProducts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPendingProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const product = await Item.findOne({
      _id: new mongoose.Types.ObjectId(id),
      StatusId: 1,
      IsDeleted: false,
    })
      .populate({
        path: "OwnerId",
        select: "fullName avatarUrl reputationScore bio email",
        model: User,
      })
      .populate({
        path: "CategoryId",
        select: "name description",
        model: Category,
      });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or not pending" });
    }

    const condition = await ItemConditions.findOne({
      ConditionId: product.ConditionId,
      IsDeleted: false,
    }).select("ConditionName");

    const priceUnit = await PriceUnits.findOne({
      UnitId: product.PriceUnitId,
      IsDeleted: false,
    }).select("UnitName");

    const images = await ItemImage.find({
      ItemId: product._id,
      IsDeleted: false,
    }).sort({ Ordinal: 1 });

    res.json({
      ...product.toObject(),
      _id: product._id.toString(),
      images: images.map((img) => ({

        url: img.Url,
        isPrimary: img.IsPrimary,
        ordinal: img.Ordinal,
      })),
      ownerInfo: product.OwnerId,
      categoryName: product.CategoryId?.name || "N/A",
      conditionName: condition?.ConditionName || "N/A",
      priceUnitName: priceUnit?.UnitName || "N/A",
    });
  } catch (error) {
    console.error("Error in getPendingProductDetails:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const productToUpdate = await Item.findOne({
      _id: new mongoose.Types.ObjectId(id),
      IsDeleted: false,
    }).populate("OwnerId", "email fullName");

    if (!productToUpdate) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (productToUpdate.StatusId !== 1) {
      return res
        .status(400)
        .json({ message: "Product is not pending approval" });
    }

    const updatedProduct = await Item.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), IsDeleted: false },
      {
        StatusId: 2, // Approved
        UpdatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Log audit 
    await logAudit(
      "items",
      updatedProduct._id,
      "UPDATE",
      req.user._id,
      "Product approved by moderator"
    );
    try {
      const ownerEmail = productToUpdate.OwnerId?.email;
      const ownerName = productToUpdate.OwnerId?.fullName || "User";
      if (ownerEmail) {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #007bff;">Chào mừng bạn đến với RetroTrade!</h2>
            <p>Kính gửi <strong>${ownerName}</strong>,</p>
            <br>
            <p>Chúng tôi rất vui mừng thông báo rằng sản phẩm <strong>"${updatedProduct.Title}"</strong> của bạn đã được sẵn sàng công khai trên nền tảng.</p>
            <p>Bạn có thể theo dõi lượt xem, yêu thích và đơn thuê mới từ phần <strong>Sản phẩm của tôi</strong> trong tài khoản của mình.</p>
            <p>Trân trọng,<br>
            <strong>Đội ngũ RetroTrade</strong><br>
            <em>Hệ thống cho thuê thông minh & an toàn</em></p>
          </div>
        `;
        sendEmail(ownerEmail, "Sản phẩm của bạn đã được duyệt trên RetroTrade", htmlBody);
      }

      // Tạo notification
      if (productToUpdate.OwnerId?._id) {
        await Notification.create({
          user: productToUpdate.OwnerId._id,
          notificationType: "Product Approved",
          title: "Duyệt sản phẩm",
          body: `Sản phẩm "${updatedProduct.Title}" đã được duyệt.`,
          metaData: JSON.stringify({ itemId: updatedProduct._id }),
          isRead: false,
        });
      }
    } catch (notificationError) {
      console.error("Error in notification/email for approve:", notificationError);
    }

    res.json({
      message: "Sản phẩm đã được duyệt thành công",
      itemId: updatedProduct._id.toString(),
    });
  } catch (error) {
    console.error("Error in approveProduct:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const productToUpdate = await Item.findOne({
      _id: new mongoose.Types.ObjectId(id),
      IsDeleted: false,
    }).populate("OwnerId", "email fullName");

    if (!productToUpdate) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (productToUpdate.StatusId !== 1) {
      return res
        .status(400)
        .json({ message: "Product is not pending approval" });
    }

    const updatedProduct = await Item.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), IsDeleted: false },
      {
        StatusId: 3, // Rejected
        UpdatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    await ItemReject.create({
      ItemId: updatedProduct._id,
      RejectReason: reason || "No reason provided",
    });

    await logAudit(
      "items",
      updatedProduct._id,
      "UPDATE",
      req.user._id,
      `Product rejected by moderator: ${reason || "No reason provided"}`
    );

    try {
      const ownerEmail = productToUpdate.OwnerId?.email;
      const ownerName = productToUpdate.OwnerId?.fullName || "User";
      if (ownerEmail) {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #dc3545;">Thông báo từ RetroTrade</h2>
            <p>Kính gửi <strong>${ownerName}</strong>,</p>
            <br>
            <p>Chúng tôi rất tiếc phải thông báo rằng sản phẩm <strong>"${updatedProduct.Title}"</strong> của bạn chưa được duyệt và bị từ chối.</p>
            <p><strong>Lý do từ chối:</strong><br>${reason || "Vui lòng kiểm tra lại chính sách đăng sản phẩm của hệ thống (ví dụ: hình ảnh không rõ nét, mô tả thiếu thông tin, hoặc vi phạm quy định nội dung)."}</p>
            <p>Bạn có thể chỉnh sửa sản phẩm theo gợi ý và gửi duyệt lại từ phần <strong>Quản lý sản phẩm</strong>. Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ!</p>
            <p>Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ hỗ trợ qua email hoặc chat trong ứng dụng.</p>
            <p>Trân trọng,<br>
            <strong>Đội ngũ RetroTrade</strong><br>
            <em>Hệ thống cho thuê thông minh & an toàn</em></p>
          </div>
        `;
        sendEmail(ownerEmail, "Sản phẩm của bạn bị từ chối trên RetroTrade", htmlBody);
      }

      // Tạo notification 
      if (productToUpdate.OwnerId?._id) {
        await Notification.create({
          user: productToUpdate.OwnerId._id,
          notificationType: "Product Rejected",
          title: "Từ chối sản phẩm",
          body: `Sản phẩm "${updatedProduct.Title}" bị từ chối. Lý do: ${reason || "N/A"}.`,
          metaData: JSON.stringify({ itemId: updatedProduct._id, reason }),
          isRead: false,
        });
      }
    } catch (notificationError) {
      console.error("Error in notification/email for reject:", notificationError);
    }

    res.json({
      message: "Sản phẩm đã bị từ chối thành công",
      itemId: updatedProduct._id.toString(),
      reason: reason || null,
    });
  } catch (error) {
    console.error("Error in rejectProduct:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTopProductsForHighlight = async (req, res) => {
  try {
    const topItems = await Item.aggregate([
      { $match: { StatusId: 2, IsDeleted: false } },
      // Tính score: ViewCount * 0.1 + FavoriteCount * 0.3 + RentCount * 0.6
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$ViewCount', 0.1] },
              { $multiply: ['$FavoriteCount', 0.3] },
              { $multiply: ['$RentCount', 0.6] }
            ]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 20 }, //số lượng sản phẩm lấy ra
      {
        $lookup: {
          from: "users",
          localField: "OwnerId",
          foreignField: "_id",
          as: "owner",
          pipeline: [{ $project: { fullName: 1 } }]
        }
      },
      { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "CategoryId",
          foreignField: "_id",
          as: "category",
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "itemimages",
          localField: "_id",
          foreignField: "ItemId",
          as: "images",
          pipeline: [
            { $match: { IsDeleted: false } },
            { $sort: { Ordinal: 1 } },
            { $limit: 1 }
          ]
        }
      },
      { $unwind: { path: "$images", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: { $toString: "$_id" },
          Title: 1,
          BasePrice: 1,
          Currency: 1,
          IsHighlighted: 1,
          ViewCount: 1,
          FavoriteCount: 1,
          RentCount: 1,
          score: { $round: ["$score", 0] },
          ownerName: "$owner.fullName",
          categoryName: "$category.name",
          thumbnailUrl: { $ifNull: ["$images.Url", "/placeholder-image.jpg"] },
          CreatedAt: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: topItems,
      message: 'Top sản phẩm nổi bật nhất'
    });
  } catch (error) {
    console.error("Error in getTopProductsForHighlight:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const toggleHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    const { isHighlighted } = req.body;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    if (item.IsDeleted || item.StatusId !== 2) { 
      return res.status(400).json({ success: false, message: 'Không thể highlight sản phẩm này' });
    }

    const newValue = isHighlighted !== undefined ? isHighlighted : !item.IsHighlighted;
    item.IsHighlighted = newValue;
    await item.save();

    // Log audit
    await logAudit(
      "items",
      item._id,
      "UPDATE",
      req.user._id,
      `Product ${newValue ? 'highlighted' : 'unhighlighted'} by moderator`
    );

    if (newValue) {
      try {
        await Notification.create({
          user: item.OwnerId,
          notificationType: "Product Highlighted",
          title: "Sản phẩm nổi bật",
          body: `Sản phẩm "${item.Title}" đã được là sản phẩm nổi bật.`,
          metaData: JSON.stringify({ itemId: item._id }),
          isRead: false,
        });
      } catch (notificationError) {
        console.error("Lỗi thông báo nổi bật:", notificationError);
      }
    }

    res.status(200).json({
      success: true,
      message: `Đã ${newValue ? 'highlight' : 'bỏ highlight'} sản phẩm thành công`,
      data: { IsHighlighted: newValue }
    });
  } catch (error) {
    console.error("Error in toggleHighlight:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getPendingProducts,
  getPendingProductDetails,
  approveProduct,
  rejectProduct,
  getTopProductsForHighlight,
  toggleHighlight,
};