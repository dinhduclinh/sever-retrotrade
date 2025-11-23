const PriceUnits = require("../../models/Product/PriceUnits.model");

const getPriceUnits = async (req, res) => {
  try {
    const priceUnits = await PriceUnits.find({ IsDeleted: false }).sort({
      UnitId: 1,
    });
    res.status(200).json({
      success: true,
      message: "Đơn vị giá đã được lấy thành công",
      data: priceUnits,
    });
  } catch (error) {
    console.error("Lỗi khi lấy đơn vị giá:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đơn vị giá",
      error: error.message,
    });
  }
};

module.exports = { getPriceUnits };
