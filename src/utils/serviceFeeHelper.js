const ServiceFee = require("../models/ServiceFee.model");

/**
 * Lấy phí dịch vụ suất hiện tại (active)
 * @returns {Promise<number>} ServiceFee rate (0-100)
 */
const getCurrentServiceFeeRate = async () => {
  try {
    const serviceFeeRate = await ServiceFee.getCurrentServiceFeeRate();
    return serviceFeeRate;
  } catch (error) {
    console.error("Error getting current serviceFee rate:", error);
    // Trả về mặc định 3% nếu có lỗi
    return 3;
  }
};

/**
 * Tính số tiền phí dịch vụ dựa trên amount và serviceFee rate
 * @param {number} amount - Số tiền cần tính phí dịch vụ
 * @param {number|null} serviceFeeRate - Phí dịch vụ suất (nếu null sẽ lấy từ DB)
 * @returns {Promise<number>} Số tiền phí dịch vụ
 */
const calculateServiceFeeAmount = async (amount, serviceFeeRate = null) => {
  try {
    const rate = serviceFeeRate !== null ? serviceFeeRate : await getCurrentServiceFeeRate();
    const serviceFeeAmount = (amount * rate) / 100;
    return Math.round(serviceFeeAmount);
  } catch (error) {
    console.error("Error calculating serviceFee amount:", error);
    // Trả về 0 nếu có lỗi
    return 0;
  }
};

/**
 * Tính tổng tiền bao gồm phí dịch vụ
 * @param {number} amount - Số tiền gốc
 * @param {number|null} serviceFeeRate - Phí dịch vụ suất (nếu null sẽ lấy từ DB)
 * @returns {Promise<object>} { baseAmount, serviceFeeAmount, totalAmount }
 */
const calculateWithServiceFee = async (amount, serviceFeeRate = null) => {
  try {
    const rate = serviceFeeRate !== null ? serviceFeeRate : await getCurrentServiceFeeRate();
    const serviceFeeAmount = (amount * rate) / 100;
    const totalAmount = amount + serviceFeeAmount;

    return {
      baseAmount: Math.round(amount),
      serviceFeeRate: rate,
      serviceFeeAmount: Math.round(serviceFeeAmount),
      totalAmount: Math.round(totalAmount),
    };
  } catch (error) {
    console.error("Error calculating with serviceFee:", error);
    // Trả về giá trị mặc định nếu có lỗi
    return {
      baseAmount: Math.round(amount),
      serviceFeeRate: 3,
      serviceFeeAmount: Math.round((amount * 3) / 100),
      totalAmount: Math.round(amount + (amount * 3) / 100),
    };
  }
};

/**
 * Lấy thông tin phí dịch vụ đầy đủ (để log hoặc hiển thị)
 * @returns {Promise<object>} ServiceFee information
 */
const getServiceFeeInfo = async () => {
  try {
    const serviceFee = await ServiceFee.getCurrentServiceFee();
    return {
      serviceFeeRate: serviceFee ? serviceFee.serviceFeeRate : 3,
      description: serviceFee ? serviceFee.description : "Phí dịch vụ mặc định",
      isActive: serviceFee ? serviceFee.isActive : false,
      effectiveFrom: serviceFee ? serviceFee.effectiveFrom : null,
    };
  } catch (error) {
    console.error("Error getting serviceFee info:", error);
    return {
      serviceFeeRate: 3,
      description: "Phí dịch vụ mặc định",
      isActive: false,
      effectiveFrom: null,
    };
  }
};

module.exports = {
  getCurrentServiceFeeRate,
  calculateServiceFeeAmount,
  calculateWithServiceFee,
  getServiceFeeInfo,
};

