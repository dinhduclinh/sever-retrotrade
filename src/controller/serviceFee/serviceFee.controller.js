const ServiceFee = require("../../models/ServiceFee.model");
const AuditLog = require("../../models/AuditLog.model");

/**
 * Lấy cấu hình phí dịch vụ hiện tại (public)
 * Tự động cập nhật trạng thái serviceFee khi query
 */
const getCurrentServiceFee = async (req, res) => {
  try {
    const now = new Date();

    // Tự động deactivate serviceFee hết hạn
    await ServiceFee.updateMany(
      {
        isActive: true,
        effectiveTo: { $exists: true, $lt: now },
      },
      {
        $set: { isActive: false },
      }
    );

    // KHÔNG tự động activate - để admin tự chọn serviceFee để activate

    const serviceFee = await ServiceFee.getCurrentServiceFee();
    
    if (!serviceFee) {
      // Nếu không có serviceFee active, trả về serviceFee mặc định 3%
      // Lưu ý: Đây chỉ là giá trị mặc định trong code, không phải serviceFee thật trong DB
      return res.status(200).json({
        success: true,
        message: "⚠️ Chưa có cấu hình phí dịch vụ active, sử dụng phí dịch vụ mặc định 3%. Vui lòng tạo cấu hình phí dịch vụ mới.",
        data: {
          serviceFeeRate: 3,
          description: "Phí dịch vụ mặc định (tạm thời - cần tạo cấu hình phí dịch vụ mới)",
          isActive: false,
          effectiveFrom: now.toISOString(),
          effectiveTo: null,
          isDefault: true, // Flag để biết đây là serviceFee mặc định, không phải từ DB
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy cấu hình phí dịch vụ thành công",
      data: {
        serviceFeeRate: serviceFee.serviceFeeRate,
        description: serviceFee.description,
        isActive: serviceFee.isActive,
        effectiveFrom: serviceFee.effectiveFrom,
        effectiveTo: serviceFee.effectiveTo,
        createdAt: serviceFee.createdAt,
        updatedAt: serviceFee.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting current serviceFee:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy cấu hình phí dịch vụ",
      error: error.message,
    });
  }
};

/**
 * Lấy tất cả cấu hình phí dịch vụ (admin only)
 */
const getAllServiceFeeSettings = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeInactive = false } = req.query;

    const filter = {};
    if (!includeInactive) {
      filter.isActive = true;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [serviceFees, total] = await Promise.all([
      ServiceFee.find(filter)
        .populate("createdBy", "fullName email")
        .populate("updatedBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServiceFee.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách cấu hình phí dịch vụ thành công",
      data: serviceFees,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting all serviceFee settings:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách cấu hình phí dịch vụ",
      error: error.message,
    });
  }
};

/**
 * Tạo cấu hình phí dịch vụ mới (admin only)
 */
const createServiceFeeSetting = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { serviceFeeRate, description, effectiveFrom, effectiveTo } = req.body;

    // Validation
    if (!serviceFeeRate || serviceFeeRate < 0 || serviceFeeRate > 100) {
      return res.status(400).json({
        success: false,
        message: "Phí dịch vụ suất phải từ 0% đến 100%",
      });
    }

    const now = new Date();
    const effectiveFromDate = effectiveFrom ? new Date(effectiveFrom) : now;
    const effectiveToDate = effectiveTo ? new Date(effectiveTo) : null;

    // Validation dates
    if (effectiveToDate && effectiveToDate <= effectiveFromDate) {
      return res.status(400).json({
        success: false,
        message: "Ngày hiệu lực đến phải sau ngày hiệu lực từ",
      });
    }

    // KHÔNG tự động activate - để admin tự chọn khi nào activate
    // Tạo serviceFee setting mới với isActive = false
    const newServiceFee = await ServiceFee.create({
      serviceFeeRate: Number(serviceFeeRate),
      description: description || `Phí dịch vụ suất ${serviceFeeRate}%`,
      isActive: false, // Luôn tạo với isActive = false, admin sẽ activate sau
      effectiveFrom: effectiveFromDate,
      effectiveTo: effectiveToDate,
      createdBy: userId,
      updatedBy: userId,
    });

    // Ghi audit log
    try {
      await AuditLog.create({
        TableName: "ServiceFee",
        PrimaryKeyValue: newServiceFee._id.toString(),
        Operation: "INSERT",
        ChangedByUserId: userId,
        ChangedAt: new Date(),
        ChangeSummary: `Tạo cấu hình phí dịch vụ mới: ${serviceFeeRate}% - ${description || `Phí dịch vụ suất ${serviceFeeRate}%`}`,
      });
    } catch (logError) {
      console.error("Error creating audit log:", logError);
      // Không throw error để không ảnh hưởng đến operation chính
    }

    return res.status(201).json({
      success: true,
      message: "Tạo cấu hình phí dịch vụ thành công",
      data: newServiceFee,
    });
  } catch (error) {
    console.error("Error creating serviceFee setting:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo cấu hình phí dịch vụ",
      error: error.message,
    });
  }
};

/**
 * Cập nhật cấu hình phí dịch vụ (admin only)
 */
const updateServiceFeeSetting = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { serviceFeeRate, description, effectiveFrom, effectiveTo, isActive } =
      req.body;

    const serviceFee = await ServiceFee.findById(id);
    if (!serviceFee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cấu hình phí dịch vụ",
      });
    }

    // Lưu thông tin CŨ trước khi cập nhật để lưu vào history
    const oldServiceFeeRate = serviceFee.serviceFeeRate;
    const oldDescription = serviceFee.description;
    const oldEffectiveFrom = serviceFee.effectiveFrom;
    const oldEffectiveTo = serviceFee.effectiveTo;
    const oldIsActive = serviceFee.isActive;

    // Validation serviceFeeRate nếu có
    if (serviceFeeRate !== undefined) {
      if (serviceFeeRate < 0 || serviceFeeRate > 100) {
        return res.status(400).json({
          success: false,
          message: "Phí dịch vụ suất phải từ 0% đến 100%",
        });
      }
    }

    // Kiểm tra xem có thay đổi gì không
    let hasChanges = false;
    if (serviceFeeRate !== undefined && Number(serviceFeeRate) !== oldServiceFeeRate) hasChanges = true;
    if (description !== undefined && description !== oldDescription) hasChanges = true;
    if (effectiveFrom !== undefined && new Date(effectiveFrom).getTime() !== new Date(oldEffectiveFrom).getTime()) hasChanges = true;
    if (effectiveTo !== undefined) {
      const newEffectiveTo = effectiveTo ? new Date(effectiveTo) : null;
      const oldEffectiveToTime = oldEffectiveTo ? new Date(oldEffectiveTo).getTime() : null;
      if (newEffectiveTo?.getTime() !== oldEffectiveToTime) hasChanges = true;
    }
    if (isActive !== undefined && isActive !== oldIsActive) hasChanges = true;

    // Lưu lịch sử thay đổi NẾU có thay đổi
    if (hasChanges) {
      const historyEntry = {
        serviceFeeRate: oldServiceFeeRate,
        description: oldDescription,
        effectiveFrom: oldEffectiveFrom,
        effectiveTo: oldEffectiveTo,
        changedAt: new Date(),
        changedBy: userId,
      };
      serviceFee.history.push(historyEntry);
    }

    // Cập nhật thông tin
    if (serviceFeeRate !== undefined) serviceFee.serviceFeeRate = Number(serviceFeeRate);
    if (description !== undefined) serviceFee.description = description;
    if (effectiveFrom !== undefined)
      serviceFee.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo !== undefined)
      serviceFee.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
    if (isActive !== undefined) {
      serviceFee.isActive = isActive;
      // Nếu kích hoạt serviceFee này, tắt các serviceFee khác
      if (isActive) {
        await ServiceFee.updateMany(
          { _id: { $ne: id }, isActive: true },
          { isActive: false }
        );
      }
    }
    serviceFee.updatedBy = userId;

    await serviceFee.save();

    // Chuẩn bị mô tả thay đổi cho audit log
    const changes = [];
    if (serviceFeeRate !== undefined && Number(serviceFeeRate) !== oldServiceFeeRate) {
      changes.push(`Phí dịch vụ suất: ${oldServiceFeeRate}% → ${serviceFeeRate}%`);
    }
    if (description !== undefined && description !== oldDescription) {
      changes.push(`Mô tả: "${oldDescription || 'N/A'}" → "${description}"`);
    }
    if (effectiveFrom !== undefined && new Date(effectiveFrom).getTime() !== new Date(oldEffectiveFrom).getTime()) {
      changes.push(`Hiệu lực từ: ${new Date(oldEffectiveFrom).toLocaleDateString('vi-VN')} → ${new Date(effectiveFrom).toLocaleDateString('vi-VN')}`);
    }
    if (effectiveTo !== undefined) {
      const newEffectiveTo = effectiveTo ? new Date(effectiveTo) : null;
      const oldEffectiveToTime = oldEffectiveTo ? new Date(oldEffectiveTo).getTime() : null;
      if (newEffectiveTo?.getTime() !== oldEffectiveToTime) {
        changes.push(`Hiệu lực đến: ${oldEffectiveTo ? new Date(oldEffectiveTo).toLocaleDateString('vi-VN') : 'Không giới hạn'} → ${newEffectiveTo ? newEffectiveTo.toLocaleDateString('vi-VN') : 'Không giới hạn'}`);
      }
    }
    if (isActive !== undefined && isActive !== oldIsActive) {
      changes.push(`Trạng thái: ${oldIsActive ? 'Active' : 'Inactive'} → ${isActive ? 'Active' : 'Inactive'}`);
    }

    // Ghi audit log
    try {
      await AuditLog.create({
        TableName: "ServiceFee",
        PrimaryKeyValue: serviceFee._id.toString(),
        Operation: "UPDATE",
        ChangedByUserId: userId,
        ChangedAt: new Date(),
        ChangeSummary: changes.length > 0 
          ? `Cập nhật cấu hình phí dịch vụ: ${changes.join(', ')}`
          : "Cập nhật cấu hình phí dịch vụ",
      });
    } catch (logError) {
      console.error("Error creating audit log:", logError);
      // Không throw error để không ảnh hưởng đến operation chính
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật cấu hình phí dịch vụ thành công",
      data: serviceFee,
    });
  } catch (error) {
    console.error("Error updating serviceFee setting:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật cấu hình phí dịch vụ",
      error: error.message,
    });
  }
};

/**
 * Xóa cấu hình phí dịch vụ (admin only) - soft delete
 */
const deleteServiceFeeSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceFee = await ServiceFee.findById(id);
    if (!serviceFee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cấu hình phí dịch vụ",
      });
    }

    // Chỉ xóa nếu không phải serviceFee đang active
    if (serviceFee.isActive) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa cấu hình phí dịch vụ đang được sử dụng",
      });
    }

    // Lưu thông tin trước khi xóa để ghi log
    const serviceFeeInfo = {
      serviceFeeRate: serviceFee.serviceFeeRate,
      description: serviceFee.description,
      isActive: serviceFee.isActive,
    };

    await ServiceFee.findByIdAndDelete(id);

    // Ghi audit log
    try {
      await AuditLog.create({
        TableName: "ServiceFee",
        PrimaryKeyValue: id,
        Operation: "DELETE",
        ChangedByUserId: req.user._id || req.user.id,
        ChangedAt: new Date(),
        ChangeSummary: `Xóa cấu hình phí dịch vụ: ${serviceFeeInfo.serviceFeeRate}% - ${serviceFeeInfo.description || 'N/A'} (${serviceFeeInfo.isActive ? 'Active' : 'Inactive'})`,
      });
    } catch (logError) {
      console.error("Error creating audit log:", logError);
      // Không throw error để không ảnh hưởng đến operation chính
    }

    return res.status(200).json({
      success: true,
      message: "Xóa cấu hình phí dịch vụ thành công",
    });
  } catch (error) {
    console.error("Error deleting serviceFee setting:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa cấu hình phí dịch vụ",
      error: error.message,
    });
  }
};

/**
 * Lấy lịch sử thay đổi phí dịch vụ (admin only)
 */
const getServiceFeeHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceFee = await ServiceFee.findById(id).populate(
      "history.changedBy",
      "fullName email"
    );

    if (!serviceFee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cấu hình phí dịch vụ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy lịch sử thay đổi phí dịch vụ thành công",
      data: {
        currentServiceFee: {
          serviceFeeRate: serviceFee.serviceFeeRate,
          description: serviceFee.description,
          effectiveFrom: serviceFee.effectiveFrom,
          effectiveTo: serviceFee.effectiveTo,
        },
        history: serviceFee.history,
      },
    });
  } catch (error) {
    console.error("Error getting serviceFee history:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử thay đổi phí dịch vụ",
      error: error.message,
    });
  }
};

/**
 * Lấy tất cả lịch sử serviceFee (admin only) - tất cả các serviceFee và history của chúng
 */
const getAllServiceFeeHistory = async (req, res) => {
  try {
    // Lấy tất cả serviceFee settings với history
    const serviceFees = await ServiceFee.find({})
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .populate("history.changedBy", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    // Tạo timeline từ tất cả các event (tạo serviceFee + history của mỗi serviceFee)
    const timeline = [];

    serviceFees.forEach((serviceFee) => {
      // Thêm event "Tạo serviceFee"
      timeline.push({
        type: "create",
        serviceFeeId: serviceFee._id,
        serviceFeeRate: serviceFee.serviceFeeRate,
        description: serviceFee.description,
        effectiveFrom: serviceFee.effectiveFrom,
        effectiveTo: serviceFee.effectiveTo,
        isActive: serviceFee.isActive,
        createdAt: serviceFee.createdAt,
        changedBy: serviceFee.createdBy,
        serviceFeeInfo: {
          _id: serviceFee._id,
          serviceFeeRate: serviceFee.serviceFeeRate,
          description: serviceFee.description,
        },
      });

      // Thêm tất cả history entries
      if (serviceFee.history && serviceFee.history.length > 0) {
        serviceFee.history.forEach((historyEntry) => {
          timeline.push({
            type: "update",
            serviceFeeId: serviceFee._id,
            serviceFeeRate: historyEntry.serviceFeeRate,
            description: historyEntry.description,
            effectiveFrom: historyEntry.effectiveFrom,
            effectiveTo: historyEntry.effectiveTo,
            changedAt: historyEntry.changedAt,
            changedBy: historyEntry.changedBy,
            serviceFeeInfo: {
              _id: serviceFee._id,
              serviceFeeRate: serviceFee.serviceFeeRate, // Current serviceFee rate
              description: serviceFee.description, // Current description
            },
          });
        });
      }
    });

    // Sắp xếp timeline theo thời gian (mới nhất trước)
    timeline.sort((a, b) => {
      const dateA = a.type === "create" ? new Date(a.createdAt) : new Date(a.changedAt);
      const dateB = b.type === "create" ? new Date(b.createdAt) : new Date(b.changedAt);
      return dateB.getTime() - dateA.getTime();
    });

    return res.status(200).json({
      success: true,
      message: "Lấy tất cả lịch sử phí dịch vụ thành công",
      data: {
        timeline,
        totalEvents: timeline.length,
        totalServiceFees: serviceFees.length,
      },
    });
  } catch (error) {
    console.error("Error getting all serviceFee history:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy tất cả lịch sử phí dịch vụ",
      error: error.message,
    });
  }
};

/**
 * Kích hoạt serviceFee (admin only) - chỉ cho phép activate serviceFee đang trong hiệu lực
 */
const activateServiceFee = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const serviceFee = await ServiceFee.findById(id);
    if (!serviceFee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cấu hình phí dịch vụ",
      });
    }

    const now = new Date();

    // Kiểm tra serviceFee có đang trong hiệu lực không
    const isInEffect = serviceFee.effectiveFrom <= now && 
      (!serviceFee.effectiveTo || serviceFee.effectiveTo >= now);

    if (!isInEffect) {
      return res.status(400).json({
        success: false,
        message: "Không thể kích hoạt serviceFee chưa đến hiệu lực hoặc đã hết hạn",
      });
    }

    // Nếu serviceFee đã active rồi
    if (serviceFee.isActive) {
      return res.status(200).json({
        success: true,
        message: "ServiceFee này đã được kích hoạt",
        data: serviceFee,
      });
    }

    // Lưu lịch sử thay đổi
    const historyEntry = {
      serviceFeeRate: serviceFee.serviceFeeRate,
      description: serviceFee.description,
      effectiveFrom: serviceFee.effectiveFrom,
      effectiveTo: serviceFee.effectiveTo,
      changedAt: new Date(),
      changedBy: userId,
    };
    serviceFee.history.push(historyEntry);

    // Tắt tất cả serviceFee active khác
    await ServiceFee.updateMany(
      { _id: { $ne: id }, isActive: true },
      { isActive: false }
    );

    // Activate serviceFee này
    serviceFee.isActive = true;
    serviceFee.updatedBy = userId;
    await serviceFee.save();

    // Ghi audit log
    try {
      await AuditLog.create({
        TableName: "ServiceFee",
        PrimaryKeyValue: serviceFee._id.toString(),
        Operation: "UPDATE",
        ChangedByUserId: userId,
        ChangedAt: new Date(),
        ChangeSummary: `Kích hoạt cấu hình phí dịch vụ: ${serviceFee.serviceFeeRate}% - ${serviceFee.description || 'N/A'}`,
      });
    } catch (logError) {
      console.error("Error creating audit log:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Kích hoạt cấu hình phí dịch vụ thành công",
      data: serviceFee,
    });
  } catch (error) {
    console.error("Error activating serviceFee:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kích hoạt cấu hình phí dịch vụ",
      error: error.message,
    });
  }
};

module.exports = {
  getCurrentServiceFee,
  getAllServiceFeeSettings,
  createServiceFeeSetting,
  updateServiceFeeSetting,
  deleteServiceFeeSetting,
  getServiceFeeHistory,
  getAllServiceFeeHistory,
  activateServiceFee,
};

