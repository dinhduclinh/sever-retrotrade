const ItemAddress = require("../../models/Product/ItemAddress.model");
const mongoose = require("mongoose");

module.exports = {
  // Lấy tất cả địa chỉ của user hiện tại
  getUserAddresses: async (req, res) => {
    try {
      const userId = req.user._id;
      console.log("getUserAddresses - userId:", userId);

      const addresses = await ItemAddress.find({ UserId: userId })
        .sort({ IsDefault: -1, CreatedAt: -1 })
        .lean();

      console.log("getUserAddresses - found addresses:", addresses?.length || 0);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách địa chỉ thành công",
        data: addresses || [],
      });
    } catch (error) {
      console.error("getUserAddresses error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách địa chỉ",
        error: error.message,
      });
    }
  },

  // Tạo địa chỉ mới
  createUserAddress: async (req, res) => {
    try {
      const userId = req.user._id;
      const { Address, City, District, IsDefault } = req.body;

      // Validate
      if (!Address || !City || !District) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc: Address, City, District",
        });
      }

      // Địa chỉ mới luôn được set làm mặc định
      // Bỏ mặc định của tất cả địa chỉ khác
      await ItemAddress.updateMany(
        { UserId: userId },
        { $set: { IsDefault: false } }
      );

      const newAddress = new ItemAddress({
        UserId: userId,
        Address: Address.trim(),
        City: City.trim(),
        District: District.trim(),
        IsDefault: true, // Luôn set làm mặc định cho địa chỉ mới
      });

      await newAddress.save();

      return res.status(201).json({
        success: true,
        message: "Tạo địa chỉ thành công",
        data: newAddress,
      });
    } catch (error) {
      console.error("createUserAddress error:", error);
      
      // Handle duplicate error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Địa chỉ này đã tồn tại",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo địa chỉ",
        error: error.message,
      });
    }
  },

  // Cập nhật địa chỉ
  updateUserAddress: async (req, res) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;
      const { Address, City, District, IsDefault } = req.body;

      if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(400).json({
          success: false,
          message: "ID địa chỉ không hợp lệ",
        });
      }

      const address = await ItemAddress.findOne({
        _id: addressId,
        UserId: userId,
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy địa chỉ",
        });
      }

      // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
      // Đảm bảo chỉ có duy nhất 1 địa chỉ mặc định
      if (IsDefault !== undefined && IsDefault === true) {
        await ItemAddress.updateMany(
          { UserId: userId, _id: { $ne: addressId } },
          { $set: { IsDefault: false } }
        );
      }

      // Cập nhật fields
      if (Address !== undefined) address.Address = Address.trim();
      if (City !== undefined) address.City = City.trim();
      if (District !== undefined) address.District = District.trim();
      if (IsDefault !== undefined) address.IsDefault = IsDefault;

      await address.save();

      return res.status(200).json({
        success: true,
        message: "Cập nhật địa chỉ thành công",
        data: address,
      });
    } catch (error) {
      console.error("updateUserAddress error:", error);

      // Handle duplicate error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Địa chỉ này đã tồn tại",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật địa chỉ",
        error: error.message,
      });
    }
  },

  // Xóa địa chỉ
  deleteUserAddress: async (req, res) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(400).json({
          success: false,
          message: "ID địa chỉ không hợp lệ",
        });
      }

      const address = await ItemAddress.findOneAndDelete({
        _id: addressId,
        UserId: userId,
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy địa chỉ",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Xóa địa chỉ thành công",
        data: address,
      });
    } catch (error) {
      console.error("deleteUserAddress error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa địa chỉ",
        error: error.message,
      });
    }
  },
};

