const ServiceFee = require("../../models/ServiceFee.model");

/**
 * Tự động cập nhật trạng thái serviceFee:
 * - Deactivate serviceFee đã hết hạn (effectiveTo < now)
 * - Activate serviceFee đến hạn (effectiveFrom <= now && chưa hết hạn && chưa active)
 */
const autoUpdateServiceFeeStatus = async () => {
  try {
    const now = new Date();

    // 1. Deactivate các serviceFee đã hết hạn
    const expiredServiceFees = await ServiceFee.updateMany(
      {
        isActive: true,
        effectiveTo: { $exists: true, $lt: now },
      },
      {
        $set: { isActive: false },
      }
    );

    // 2. KHÔNG tự động activate serviceFee đến hạn - để admin tự chọn
    // Chỉ log thông tin về serviceFee có thể activate
    const availableServiceFees = await ServiceFee.find({
      isActive: false,
      effectiveFrom: { $lte: now },
      $or: [
        { effectiveTo: { $exists: false } }, // Không có hạn
        { effectiveTo: { $gte: now } }, // Chưa hết hạn
      ],
    })
      .sort({ effectiveFrom: -1 })
      .limit(1)
      .exec();

    if (availableServiceFees.length > 0) {
      const activeServiceFee = await ServiceFee.findOne({ isActive: true });
      
      if (!activeServiceFee && expiredServiceFees.modifiedCount > 0) {
        // Nếu serviceFee vừa hết hạn và không có serviceFee mới
        console.warn(
          `⚠️ Cảnh báo: ServiceFee đã hết hạn nhưng không có serviceFee active. Có ${availableServiceFees.length} serviceFee đang trong hiệu lực có thể được activate bởi admin. Hệ thống đang dùng serviceFee mặc định 3%.`
        );
      }
    }

    if (expiredServiceFees.modifiedCount > 0) {
      console.log(
        `Đã deactivate ${expiredServiceFees.modifiedCount} serviceFee hết hạn`
      );
    }

    return {
      expiredCount: expiredServiceFees.modifiedCount,
      activatedId: null, // Không tự động activate serviceFee
    };
  } catch (error) {
    console.error("Lỗi tự động cập nhật trạng thái serviceFee:", error);
    throw error;
  }
};

module.exports = {
  autoUpdateServiceFeeStatus,
};

