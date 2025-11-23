const ItemConditions = require("../../models/Product/ItemConditions.model");

const getConditions = async (req, res) => {
  try {
    const conditions = await ItemConditions.find({ IsDeleted: false }).sort({
      ConditionId: 1,
    });
    res.status(200).json({
      success: true,
      message: "Điều kiện được lấy thành công",
      data: conditions,
    });
  } catch (error) {
    console.error("Lỗi khi lấy điều kiện:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ khi lấy điều kiện",
      error: error.message,
    });
  }
};

module.exports = { getConditions };