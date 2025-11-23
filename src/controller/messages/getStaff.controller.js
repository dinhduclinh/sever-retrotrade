const User = require("../../models/User.model");

// Lấy danh sách nhân viên hỗ trợ (admin, moderator)
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ["admin", "moderator"] } })
      .select("fullName email avatarUrl role");

    res.json({
      code: 200,
      message: "Lấy danh sách nhân viên hỗ trợ thành công",
      data: staff,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
  }
};

module.exports = { getStaff };


